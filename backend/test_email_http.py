import sys
import os
import logging
import httpx
import json

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_email_http():
    print("Testing Email Service via HTTP (SendGrid API)...")
    
    api_key = settings.SMTP_PASSWORD
    if not api_key:
        print("Error: SMTP_PASSWORD (API Key) is missing")
        return

    url = "https://api.sendgrid.com/v3/mail/send"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "personalizations": [{
            "to": [{"email": "ogerolazarus6@gmail.com"}]
        }],
        "from": {"email": settings.EMAIL_FROM},
        "subject": "Test - HTTP API Fallback",
        "content": [{
            "type": "text/plain",
            "value": "This is a test email sent via SendGrid HTTP API because SMTP failed."
        }]
    }
    
    print(f"Sending request to {url}...")
    try:
        response = httpx.post(url, headers=headers, json=data, timeout=30.0)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code in [200, 201, 202]:
            print("Email sent successfully via HTTP!")
        else:
            print("Failed to send email via HTTP.")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_email_http()
