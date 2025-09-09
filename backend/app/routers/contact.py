"""
Contact form API router.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated, Dict, Any, Optional
from pymongo.collection import Collection
from datetime import datetime

from app.schemas.contact import ContactRequest, ContactResponse, ContactSubmissionsResponse, ContactUpdate, ContactSubmission, AdminNoteResponse, AdminAssignRequest, AdminNoteRequest
from app.services.email import email_service
from app.auth.dependencies import get_current_user, admin_required
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
    raw_submissions = await cursor.to_list(length=limit)
    
    # Convert raw documents to ContactSubmission objects
    submissions = []
    for doc in raw_submissions:
        # Handle backward compatibility - if adminId contains a string, it's likely messageId
        admin_id = doc.get("adminId")
        message_id = doc.get("messageId")
        
        # Fix adminId if it contains a string (old format)
        if admin_id and isinstance(admin_id, str):
            # Move string adminId to messageId if messageId is empty
            if not message_id:
                message_id = admin_id
            admin_id = None
        
        # Create ContactSubmission with proper field mapping
        submission = ContactSubmission(
            id=doc["id"],
            email=doc["email"],
            message=doc["message"],
            userId=doc.get("userId"),
            status=doc["status"],
            adminId=admin_id,  # Should be an integer or None
            messageId=message_id,  # Should be string or None
            errorMessage=doc.get("errorMessage"),
            adminNotes=[AdminNoteResponse(**note) for note in doc.get("adminNotes", [])],
            schemaVersion=doc.get("schemaVersion", 1),
            createdAt=doc["createdAt"],
            updatedAt=doc["updatedAt"]
        )
        submissions.append(submission)
    
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
        status=ContactStatus.SENT,  # User has sent the submission
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
            # Update contact with message ID (status remains SENT)
            contact.update_status(ContactStatus.SENT, message_id=message_id)
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
            # Keep status as SENT but add error message for admin review
            contact.update_status(ContactStatus.SENT, error_message=message)
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


@router.put("/admin/{contactId}", response_model=ContactResponse)
async def update_contact_submission(
    contactId: int,
    contact_update: ContactUpdate,
    adminUser: Annotated[UserModel, Depends(admin_required)]
) -> ContactResponse:
    """
    Update a contact form submission (Admin only).
    
    Allows updating status and adding admin notes.
    """
    collection: Collection = db_manager.get_collection("contacts")
    
    # Find the contact submission
    contact_data = await collection.find_one({"id": contactId})
    if not contact_data:
        raise HTTPException(
            status_code=404,
            detail="Contact submission not found"
        )
    
    # Create ContactModel from existing data
    contact = ContactModel.from_dict(contact_data)
    
    # Update fields if provided
    if contact_update.status is not None:
        # Auto-assign admin when status changes to PENDING (reviewing)
        if contact_update.status == ContactStatus.PENDING and contact.adminId is None:
            contact.update_status(contact_update.status, adminId=adminUser.id)
        # Auto-assign admin for other status changes if not already assigned
        elif contact.adminId is None and contact_update.status in [ContactStatus.DONE, ContactStatus.CLOSED]:
            contact.update_status(contact_update.status, adminId=adminUser.id)
        else:
            contact.update_status(contact_update.status)
    
    if contact_update.adminNote is not None:
        contact.add_admin_note(adminUser.id, contact_update.adminNote)
    
    # Update timestamp
    contact.updatedAt = datetime.now()
    
    try:
        # Save updated contact
        await collection.replace_one(
            {"id": contactId},
            contact.to_dict()
        )
        
        return ContactResponse(
            success=True,
            message="Contact submission updated successfully",
            messageId=contact.messageId
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update contact submission: {str(e)}"
        )


@router.delete("/admin/{contactId}", response_model=ContactResponse)
async def delete_contact_submission(
    contactId: int,
    adminUser: Annotated[UserModel, Depends(admin_required)]
) -> ContactResponse:
    """
    Delete a contact form submission (Admin only).
    
    Permanently removes the contact submission from the database.
    """
    collection: Collection = db_manager.get_collection("contacts")
    
    # Check if contact exists
    contact_data = await collection.find_one({"id": contactId})
    if not contact_data:
        raise HTTPException(
            status_code=404,
            detail="Contact submission not found"
        )
    
    try:
        # Delete the contact submission
        result = await collection.delete_one({"id": contactId})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Contact submission not found"
            )
        
        return ContactResponse(
            success=True,
            message="Contact submission deleted successfully",
            messageId=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete contact submission: {str(e)}"
        )


@router.post("/admin/{contactId}/unassign", response_model=ContactResponse)
async def unassign_admin_from_contact(
    contactId: int,
    adminUser: Annotated[UserModel, Depends(admin_required)]
) -> ContactResponse:
    """
    Remove admin assignment from a contact submission (Admin only).
    """
    collection: Collection = db_manager.get_collection("contacts")
    
    # Find the contact submission
    contact_data = await collection.find_one({"id": contactId})
    if not contact_data:
        raise HTTPException(
            status_code=404,
            detail="Contact submission not found"
        )
    
    # Create ContactModel from existing data
    contact = ContactModel.from_dict(contact_data)
    
    # Unassign admin
    contact.unassign_admin()
    
    try:
        # Save updated contact
        await collection.replace_one(
            {"id": contactId},
            contact.to_dict()
        )
        
        return ContactResponse(
            success=True,
            message="Admin assignment removed successfully",
            messageId=None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to unassign admin: {str(e)}"
        )


@router.post("/admin/{contactId}/assign", response_model=ContactResponse)
async def assign_admin_to_contact(
    contactId: int,
    assign_request: AdminAssignRequest,
    adminUser: Annotated[UserModel, Depends(admin_required)]
) -> ContactResponse:
    """
    Assign an admin to a contact submission (Admin only).
    """
    collection: Collection = db_manager.get_collection("contacts")
    users_collection: Collection = db_manager.get_collection("users")
    
    # Verify the admin user exists and is an admin
    admin_to_assign = await users_collection.find_one({"id": assign_request.adminId, "isAdmin": True})
    if not admin_to_assign:
        raise HTTPException(
            status_code=404,
            detail="Admin user not found"
        )
    
    # Find the contact submission
    contact_data = await collection.find_one({"id": contactId})
    if not contact_data:
        raise HTTPException(
            status_code=404,
            detail="Contact submission not found"
        )
    
    # Create ContactModel from existing data
    contact = ContactModel.from_dict(contact_data)
    
    # Assign admin
    contact.assign_admin(assign_request.adminId)
    
    try:
        # Save updated contact
        await collection.replace_one(
            {"id": contactId},
            contact.to_dict()
        )
        
        return ContactResponse(
            success=True,
            message=f"Admin {admin_to_assign['username']} assigned successfully",
            messageId=None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assign admin: {str(e)}"
        )


@router.post("/admin/{contactId}/note", response_model=ContactResponse)
async def add_admin_note_to_contact(
    contactId: int,
    note_request: AdminNoteRequest,
    adminUser: Annotated[UserModel, Depends(admin_required)]
) -> ContactResponse:
    """
    Add an admin note to a contact submission (Admin only).
    """
    collection: Collection = db_manager.get_collection("contacts")
    
    # Find the contact submission
    contact_data = await collection.find_one({"id": contactId})
    if not contact_data:
        raise HTTPException(
            status_code=404,
            detail="Contact submission not found"
        )
    
    # Create ContactModel from existing data
    contact = ContactModel.from_dict(contact_data)
    
    # Add admin note
    contact.add_admin_note(adminUser.id, note_request.note)
    
    try:
        # Save updated contact
        await collection.replace_one(
            {"id": contactId},
            contact.to_dict()
        )
        
        return ContactResponse(
            success=True,
            message="Admin note added successfully",
            messageId=None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add admin note: {str(e)}"
        )
