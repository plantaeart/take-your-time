"""
Contact form schemas for API requests and responses.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

from app.models.enums.contactStatus import ContactStatus


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
    schemaVersion: int = Field(..., description="Schema version")
    createdAt: datetime = Field(..., description="Creation timestamp")
    updatedAt: datetime = Field(..., description="Last update timestamp")


class ContactSubmissionsResponse(BaseModel):
    """Response for admin contact submissions endpoint."""
    
    submissions: List[ContactSubmission] = Field(..., description="List of contact submissions")
    total: int = Field(..., description="Total number of submissions")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Maximum records returned")
