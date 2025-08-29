"""
Contact form API router.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated, Dict, Any, Optional
from pymongo.collection import Collection

from app.schemas.contact import ContactRequest, ContactResponse, ContactSubmissionsResponse
from app.services.email import email_service
from app.auth.dependencies import get_current_user
from app.models.user import UserModel
from app.models.contact import ContactModel, get_next_contact_id
from app.models.enums.contactStatus import ContactStatus
from app.config.database import db_manager
from app.config.schema_versions import get_schema_version

router = APIRouter(prefix="/contact", tags=["contact"])


@router.get("/admin/submissions", response_model=ContactSubmissionsResponse)
async def get_contact_submissions(
    current_user: Annotated[UserModel, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 50
) -> ContactSubmissionsResponse:
    """
    Get contact form submissions (Admin only).
    
    Requires admin authentication.
    """
    if not current_user.isAdmin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    collection: Collection = db_manager.get_collection("contacts")
    
    # Get total count
    total: int = await collection.count_documents({})
    
    # Get submissions with pagination
    cursor = collection.find({}).sort("createdAt", -1).skip(skip).limit(limit)
    submissions = await cursor.to_list(length=limit)
    
    return ContactSubmissionsResponse(
        submissions=submissions,
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("/send", response_model=ContactResponse)
async def send_contact_message(
    contact_data: ContactRequest,
    current_user: Annotated[UserModel, Depends(get_current_user)]
) -> ContactResponse:
    """
    Send contact form message to shop email and store in database.
    
    Requires user authentication.
    """
    collection: Collection = db_manager.get_collection("contacts")
    contact_id: int = await get_next_contact_id(collection)
    
    # Create contact record
    contact: ContactModel = ContactModel(
        id=contact_id,
        email=contact_data.email,
        message=contact_data.message,
        userId=current_user.id,
        status=ContactStatus.PENDING,
        schemaVersion=get_schema_version("contacts")
    )
    
    try:
        # Save contact submission to database first
        await collection.insert_one(contact.to_dict())
        
        # Send email using the email service
        success, message, message_id = await email_service.send_contact_email(
            user_email=contact_data.email,
            message=contact_data.message
        )
        
        if success:
            # Update contact status to SENT
            contact.update_status(ContactStatus.SENT, message_id)
            await collection.replace_one(
                {"id": contact_id},
                contact.to_dict()
            )
            
            return ContactResponse(
                success=True,
                message="Your message has been sent successfully. We'll get back to you soon!",
                messageId=message_id
            )
        else:
            # Update contact status to FAILED
            contact.update_status(ContactStatus.FAILED, error_message=message)
            await collection.replace_one(
                {"id": contact_id},
                contact.to_dict()
            )
            
            # Return specific error message from email service
            raise HTTPException(
                status_code=500,
                detail=message
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
        
    except Exception as e:
        # Update contact status to FAILED if not already saved
        try:
            contact.update_status(ContactStatus.FAILED, error_message=str(e))
            await collection.replace_one(
                {"id": contact_id},
                contact.to_dict()
            )
        except Exception:
            pass  # Don't fail if database update fails
            
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while sending your message. Please try again later."
        )
