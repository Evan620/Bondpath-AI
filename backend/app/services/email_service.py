from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    def send_signature_request(
        to_email: str,
        case_id: str,
        defendant_name: str,
        bond_amount: float,
        advisor_name: str,
        signature_link: str
    ) -> bool:
        """
        Send signature request email to client
        
        Args:
            to_email: Client email address
            case_id: Case ID
            defendant_name: Name of defendant
            bond_amount: Bond amount
            advisor_name: Name of advisor
            signature_link: Unique signature link
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'Bail Bond Agreement - {defendant_name}'
            msg['From'] = settings.EMAIL_FROM
            msg['To'] = to_email
            
            # Create HTML content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #1e293b; color: white; padding: 20px; text-align: center; }}
                    .content {{ background-color: #f8fafc; padding: 30px; }}
                    .button {{ 
                        display: inline-block; 
                        background-color: #3b82f6; 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px;
                        font-weight: bold;
                        margin: 20px 0;
                    }}
                    .info-box {{ background-color: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #64748b; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Bail Bond Agreement Signature Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>You have been sent a bail bond agreement to review and sign electronically.</p>
                        
                        <div class="info-box">
                            <strong>Case Details:</strong><br>
                            Defendant: {defendant_name}<br>
                            Bond Amount: ${bond_amount:,.2f}<br>
                            Advisor: {advisor_name}
                        </div>
                        
                        <p>Please click the button below to review and sign the agreement documents:</p>
                        
                        <div style="text-align: center;">
                            <a href="{signature_link}" class="button">Review & Sign Agreement</a>
                        </div>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This link will expire in 7 days</li>
                            <li>You will need to sign multiple agreement documents</li>
                            <li>Please complete all signatures in one session</li>
                        </ul>
                        
                        <p>If you have any questions, please contact your advisor directly.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                        <p>Case ID: {case_id}</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email via SMTP
            try:
                logger.info(f"Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
                
                if settings.SMTP_PORT == 465:
                    # Implicit SSL (SMTPS) - Preferred for stability
                    server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20)
                    server.set_debuglevel(0) # Set to 1 to see SMTP conversation in stdout
                    server.ehlo()
                    
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        
                elif settings.SMTP_TLS:
                    # Explicit TLS (STARTTLS)
                    import ssl
                    context = ssl.create_default_context()
                    
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20)
                    server.set_debuglevel(0)
                    server.ehlo()
                    server.starttls(context=context)
                    server.ehlo()
                    
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                else:
                    # Plain SMTP (No encryption - e.g. MailHog)
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20)
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                
                # Send email
                server.send_message(msg)
                server.quit()
                
                logger.info(f"Signature request email sent to {to_email} for case {case_id}")
                return True
                
            except smtplib.SMTPAuthenticationError as auth_err:
                logger.error(f"SMTP Authentication Error: {str(auth_err)} - Check your API Key and Verified Email")
                return False
            except smtplib.SMTPException as smtp_err:
                logger.error(f"SMTP Error: {str(smtp_err)}")
                return False
            except Exception as conn_err:
                logger.error(f"Connection Error: {str(conn_err)}")
                return False
            
        except Exception as e:
            logger.error(f"Failed to send signature request email: {str(e)}")
            return False
