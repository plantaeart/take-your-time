"""
Contact submission status enumeration.
"""

from enum import Enum


class ContactStatus(str, Enum):
    """Contact form submission status values."""
    
    SENT = "SENT"           # User sent the contact submission
    PENDING = "PENDING"     # Admin is reviewing the submission
    DONE = "DONE"           # Admin has reviewed and completed
    CLOSED = "CLOSED"       # User has validated the changes/response
