"""
Email service for sending contact form messages via SMTP.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime

from app.config.settings import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP."""
    
    def __init__(self):
        settings = get_settings()
        self.smtp_server = settings.smtp_server
        self.smtp_port = settings.smtp_port
        self.smtp_username = settings.smtp_username
        self.smtp_password = settings.smtp_password
        self.shop_email = settings.shop_email
    
    async def send_contact_email(self, user_email: str, message: str) -> tuple[bool, str, Optional[str]]:
        """
        Send contact form email to shop.
        
        Args:
            user_email: Email address of the user sending the message
            message: The contact message
            
        Returns:
            Tuple of (success, message, message_id)
        """
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.smtp_username
            msg['To'] = self.shop_email
            msg['Subject'] = f"Contact Form Message from {user_email}"
            msg['Reply-To'] = user_email
            
            # Create email body
            body = self._create_email_body(user_email, message)
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                text = msg.as_string()
                server.sendmail(self.smtp_username, self.shop_email, text)
            
            logger.info(f"Contact email sent successfully from {user_email}")
            return True, "Email sent successfully", msg['Message-ID']
            
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error sending contact email: {str(e)}")
            return False, f"Failed to send email: SMTP error", None
            
        except Exception as e:
            logger.error(f"Unexpected error sending contact email: {str(e)}")
            return False, "Failed to send email: Internal server error", None
    
    def _create_email_body(self, user_email: str, message: str) -> str:
        """Create HTML email body for contact form."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        New Contact Form Message
                    </h2>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>From:</strong> {user_email}</p>
                        <p><strong>Sent:</strong> {timestamp}</p>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
                        <h3 style="color: #495057; margin-top: 0;">Message:</h3>
                        <p style="white-space: pre-wrap; margin: 0;">{message}</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px; font-size: 0.9em; color: #6c757d;">
                        <p style="margin: 0;">
                            <strong>Note:</strong> This message was sent via the contact form and requires admin attention.
                            You can reply directly to this email to respond to the customer.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """


# Global email service instance
email_service = EmailService()
