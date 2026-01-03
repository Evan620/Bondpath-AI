import sys
import os
import logging

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.services.email_service import EmailService
from app.config import settings

# Force override settings for testing
settings.SMTP_PORT = 587
settings.SMTP_TLS = True

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_email():
    print("Testing Email Service (FORCED PORT 587)...")
    print(f"SMTP Host: {settings.SMTP_HOST}")
    print(f"SMTP Port: {settings.SMTP_PORT}")
    print(f"SMTP User: {settings.SMTP_USER}")
    
    success = EmailService.send_signature_request(
        to_email="ogerolazarus6@gmail.com",  # Using the email from the screenshot
        case_id="test-case-id-123",
        defendant_name="Jaydon Welch Hayes",
        bond_amount=6000.00,
        advisor_name="Mohammed Goyette",
        signature_link="http://localhost:5173/signature/test-token"
    )
    
    if success:
        print("Email sent successfully!")
    else:
        print("Failed to send email. Check logs above.")

if __name__ == "__main__":
    test_email()
