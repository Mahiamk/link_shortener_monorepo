# In: app/core/email.py

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_welcome_email(to_email: str, name: str):
    """
    Sends a welcome email to a new user.
    """
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    FROM_EMAIL = os.getenv("FROM_EMAIL")

    # If you haven't set up SendGrid, just print to the console
    if not SENDGRID_API_KEY or not FROM_EMAIL:
        print("--- SENDGRID NOT CONFIGURED ---")
        print(f"Email: Welcome email would be sent to {to_email} for user {name}")
        print("-------------------------------")
        return

    # This is the email template
    html_content = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Welcome to LinkShorty, {name}!</h2>
        <p>We're excited to have you on board. You can now log in any time with your Google account to start shortening links and tracking your analytics.</p>
        <p>Thanks for joining!</p>
        <p>- The LinkShorty Team</p>
    </div>
    """
    
    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=to_email,
        subject='Welcome to LinkShorty!',
        html_content=html_content
    )
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Welcome email sent to {to_email}, status code: {response.status_code}")
    except Exception as e:
        print(f"Error sending welcome email to {to_email}: {e}")
        
def send_verification_email(to_email: str, token: str):
    """
    Sends an email with a verification link.
    """
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    FROM_EMAIL = os.getenv("FROM_EMAIL")
    
    # --- IMPORTANT: Change this to your frontend's URL ---
    FRONTEND_URL = "https://frontend-web-th5x.onrender.com" 
    
    verification_link = f"{FRONTEND_URL}/verify-email?token={token}"

    if not SENDGRID_API_KEY or not FROM_EMAIL:
        print("--- SENDGRID NOT CONFIGURED ---")
        print(f"Email: Verification email would be sent to {to_email}")
        print(f"Link: {verification_link}")
        print("-------------------------------")
        return

    html_content = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Welcome to LinkShorty!</h2>
        <p>Thanks for signing up. Please click the button below to verify your email address and activate your account.</p>
        <p style="text-align: center; margin: 25px 0;">
            <a href="{verification_link}"
               style="background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Your Email
            </a>
        </p>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="font-size: 0.9em; color: #555;">{verification_link}</p>
        <p>This link will expire in 1 hour.</p>
        <p>- The LinkShorty Team</p>
    </div>
    """
    
    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=to_email,
        subject='LinkShorty - Please Verify Your Email',
        html_content=html_content
    )
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Verification email sent to {to_email}, status code: {response.status_code}")
    except Exception as e:
        print(f"Error sending verification email to {to_email}: {e}")