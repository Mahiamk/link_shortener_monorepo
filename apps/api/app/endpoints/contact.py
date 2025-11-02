# In: app/endpoints/contact.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import schemas, models
from app.db.database import get_db
from app import crud
from app.endpoints.admin import get_current_superuser
from typing import List

router = APIRouter()

@router.post(
    "/contact-submissions/",
    response_model=schemas.ContactSubmission,
    status_code=status.HTTP_201_CREATED
)
def handle_contact_submission(
    submission: schemas.ContactSubmissionCreate, 
    db: Session = Depends(get_db)
):
    """
    Receives a new contact form submission from the frontend
    and saves it to the database.
    """
    try:
        created_submission = crud.create_contact_submission(db=db, submission=submission)
        return created_submission
    except Exception as e:
        print(f"Error creating contact submission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save submission."
        )


@router.get(
    "/contact-submissions/",
    response_model=List[schemas.ContactSubmission],
    dependencies=[Depends(get_current_superuser)]
)
def get_all_submissions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieves all contact submissions.
    Only accessible by an admin user.
    """
    submissions = crud.get_submissions(db, skip=skip, limit=limit)
    return submissions


@router.delete(
    "/contact-submissions/{submission_id}",
    response_model=schemas.ContactSubmission,
    dependencies=[Depends(get_current_superuser)]
)
def delete_a_submission(
    submission_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletes a specific contact submission by its ID.
    Only accessible by an admin user.
    """
    submission = crud.delete_submission(db, submission_id=submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found."
        )
    return submission