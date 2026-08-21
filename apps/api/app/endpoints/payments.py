import os
import logging
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.db import schemas, models
from app.db.database import get_db
from app.endpoints.links import get_current_user
from app.core.config import settings

logger = logging.getLogger("linkshortener.payments")

router = APIRouter()

# Initialize Stripe API Key
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

# Plan Pricing Definitions (fallback for dynamic checkout creation)
PLAN_PRICING = {
    "pro": {
        "monthly": {"amount": 900, "interval": "month", "name": "LinkShorty Pro (Monthly)"},
        "annually": {"amount": 9900, "interval": "year", "name": "LinkShorty Pro (Annual)"},
    },
    "enterprise": {
        "monthly": {"amount": 4900, "interval": "month", "name": "LinkShorty Enterprise (Monthly)"},
        "annually": {"amount": 49900, "interval": "year", "name": "LinkShorty Enterprise (Annual)"},
    }
}


@router.post("/create-checkout-session", response_model=schemas.CheckoutSessionResponse)
async def create_checkout_session(
    data: schemas.CreateCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Creates a Stripe Checkout Session for upgrading to Pro or Enterprise.
    """
    plan = data.plan.lower()
    if plan not in ("pro", "enterprise"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan selected. Must be 'pro' or 'enterprise'."
        )

    stripe_key = settings.STRIPE_SECRET_KEY or os.getenv("STRIPE_SECRET_KEY")
    if not stripe_key:
        # If no key is set yet in development, return a helpful error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment."
        )

    stripe.api_key = stripe_key
    cycle = (data.billing_cycle or "monthly").lower()
    if cycle not in ("monthly", "annually"):
        cycle = "monthly"

    # Determine Price or dynamic line items
    price_id = settings.STRIPE_PRO_PRICE_ID if plan == "pro" else settings.STRIPE_ENTERPRISE_PRICE_ID
    
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    success_url = f"{frontend_url}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend_url}/dashboard?payment=cancelled"

    try:
        # Configure customer ID if available
        customer_kwargs = {}
        if current_user.stripe_customer_id:
            customer_kwargs["customer"] = current_user.stripe_customer_id
        else:
            customer_kwargs["customer_email"] = current_user.email

        if price_id:
            line_items = [{"price": price_id, "quantity": 1}]
        else:
            plan_info = PLAN_PRICING[plan][cycle]
            line_items = [
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": plan_info["name"],
                            "description": f"Access to {plan.capitalize()} features on LinkShorty",
                        },
                        "unit_amount": plan_info["amount"],
                        "recurring": {"interval": plan_info["interval"]},
                    },
                    "quantity": 1,
                }
            ]

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=line_items,
            client_reference_id=str(current_user.id),
            metadata={
                "user_id": str(current_user.id),
                "email": current_user.email,
                "plan": plan,
            },
            subscription_data={
                "metadata": {
                    "user_id": str(current_user.id),
                    "email": current_user.email,
                    "plan": plan,
                }
            },
            success_url=success_url,
            cancel_url=cancel_url,
            **customer_kwargs
        )

        return {
            "checkout_url": session.url,
            "session_id": session.id
        }

    except Exception as e:
        logger.exception("Error creating Stripe checkout session: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate Stripe checkout."
        )


@router.post("/verify-session/{session_id}", response_model=schemas.VerifySessionResponse)
async def verify_payment_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Verifies a completed checkout session and upgrades user plan immediately.
    """
    stripe_key = settings.STRIPE_SECRET_KEY or os.getenv("STRIPE_SECRET_KEY")
    if not stripe_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured."
        )

    stripe.api_key = stripe_key

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Verify ownership / match
        session_user_id = session.metadata.get("user_id") if session.metadata else None
        session_email = session.customer_email or (session.customer_details.email if session.customer_details else None)

        if session_user_id and str(current_user.id) != str(session_user_id) and current_user.email != session_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Checkout session does not belong to the current user."
            )

        if session.payment_status in ("paid", "no_payment_required") or session.status == "complete":
            new_plan = (session.metadata.get("plan") if session.metadata else None) or "pro"
            current_user.plan = new_plan
            if session.customer:
                current_user.stripe_customer_id = str(session.customer)
            if session.subscription:
                current_user.stripe_subscription_id = str(session.subscription)
            
            db.commit()
            db.refresh(current_user)

            return {
                "status": "success",
                "plan": current_user.plan,
                "message": f"Successfully upgraded to {new_plan.capitalize()} plan!"
            }
        else:
            return {
                "status": "pending",
                "plan": current_user.plan,
                "message": "Payment is currently processing."
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error verifying Stripe session: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not verify checkout session."
        )


@router.post("/customer-portal", response_model=schemas.BillingPortalResponse)
async def create_customer_portal(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Generates a Stripe Customer Portal link for managing subscriptions.
    """
    stripe_key = settings.STRIPE_SECRET_KEY or os.getenv("STRIPE_SECRET_KEY")
    if not stripe_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured."
        )

    stripe.api_key = stripe_key

    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active Stripe customer found for this account."
        )

    try:
        frontend_url = settings.FRONTEND_URL.rstrip("/")
        portal_session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=f"{frontend_url}/dashboard"
        )
        return {"portal_url": portal_session.url}

    except Exception as e:
        logger.exception("Error creating Customer Portal session: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to open billing portal."
        )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature")
):
    """
    Receives and processes Stripe webhooks.
    """
    payload = await request.body()
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET or os.getenv("STRIPE_WEBHOOK_SECRET")

    event = None
    if webhook_secret and stripe_signature:
        try:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, webhook_secret
            )
        except Exception as e:
            logger.warning("Stripe webhook signature verification failed: %s", e)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")
    else:
        # Parse directly if webhook secret is not configured in development
        try:
            import json
            event = json.loads(payload)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")

    event_type = event.get("type") if isinstance(event, dict) else getattr(event, "type", None)
    event_data = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object

    logger.info("Received Stripe webhook event: %s", event_type)

    if event_type == "checkout.session.completed":
        session = event_data
        user_id = session.get("metadata", {}).get("user_id") or session.get("client_reference_id")
        plan = session.get("metadata", {}).get("plan", "pro")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")

        if user_id:
            user = db.query(models.User).filter(models.User.id == int(user_id)).first()
            if user:
                user.plan = plan
                if customer_id:
                    user.stripe_customer_id = customer_id
                if subscription_id:
                    user.stripe_subscription_id = subscription_id
                db.commit()
                logger.info("User %s upgraded to plan %s via webhook", user.email, plan)

    elif event_type == "customer.subscription.deleted":
        subscription = event_data
        customer_id = subscription.get("customer")
        if customer_id:
            user = db.query(models.User).filter(models.User.stripe_customer_id == customer_id).first()
            if user:
                user.plan = "free"
                user.stripe_subscription_id = None
                db.commit()
                logger.info("User %s downgraded to free plan (subscription canceled)", user.email)

    elif event_type == "invoice.payment_succeeded":
        invoice = event_data
        customer_id = invoice.get("customer")
        subscription_id = invoice.get("subscription")
        if customer_id and subscription_id:
            user = db.query(models.User).filter(models.User.stripe_customer_id == customer_id).first()
            if user and user.plan == "free":
                user.plan = "pro"
                db.commit()

    return {"status": "success"}
