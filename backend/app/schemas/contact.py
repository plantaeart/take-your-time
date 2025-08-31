"""
Contact form schemas for API requests and responses.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

from app.models.enums.contactStatus import ContactStatus


class AdminNoteResponse(BaseModel):
    """Admin note response schema."""
    
    adminId: int = Field(..., description="ID of admin who created the note")
    note: str = Field(..., description="Admin note content")
    createdAt: datetime = Field(..., description="Note creation timestamp")


class ContactRequest(BaseModel):
    """Contact form submission schema."""
    
    email: EmailStr = Field(..., description="User's email address")
    message: str = Field(..., min_length=1, max_length=300, description="Contact message (max 300 characters)")


class ContactResponse(BaseModel):
    """Contact form response schema."""
    
    success: bool = Field(..., description="Whether the email was sent successfully")
    message: str = Field(..., description="Response message")
    messageId: Optional[str] = Field(None, description="Email message ID if successful")


class ContactSubmission(BaseModel):
    """Contact submission for admin view."""
    
    id: int = Field(..., description="Contact submission ID")
    email: EmailStr = Field(..., description="User's email address")
    message: str = Field(..., description="Contact message")
    userId: Optional[int] = Field(None, description="User ID if authenticated")
    status: ContactStatus = Field(..., description="Email delivery status")
    messageId: Optional[str] = Field(None, description="Email service message ID")
    errorMessage: Optional[str] = Field(None, description="Error details if failed")
    adminNotes: List[AdminNoteResponse] = Field(default_factory=list, description="Admin notes for this submission")
    schemaVersion: int = Field(..., description="Schema version")
    createdAt: datetime = Field(..., description="Creation timestamp")
    updatedAt: datetime = Field(..., description="Last update timestamp")


class ContactSubmissionsResponse(BaseModel):
    """Response for admin contact submissions endpoint."""
    
    submissions: List[ContactSubmission] = Field(..., description="List of contact submissions")
    total: int = Field(..., description="Total number of submissions")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Maximum records returned")


class ContactUpdate(BaseModel):
    """Schema for updating contact submissions (Admin only)."""
    
    status: Optional[ContactStatus] = Field(None, description="Update contact status")
    adminNote: Optional[str] = Field(None, max_length=500, description="New admin note to add to the submission")
