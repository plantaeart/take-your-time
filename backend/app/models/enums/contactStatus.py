"""
Contact submission status enumeration.
"""

from enum import Enum


class ContactStatus(str, Enum):
    """Contact form submission status values."""
    
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
