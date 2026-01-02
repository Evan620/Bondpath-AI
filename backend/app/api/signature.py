from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..models.case import Case as CaseModel
from ..models.signature_token import SignatureToken
from ..services.email_service import EmailService
from ..config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/signature", tags=["public-signature"])


# Request/Response Models
class SendSignatureRequest(BaseModel):
    email: EmailStr


class SignatureSubmission(BaseModel):
    terms_signature: Optional[str] = None
    fee_disclosure_signature: Optional[str] = None
    contact_agreement_signature: Optional[str] = None
    indemnitor_signature: Optional[str] = None
    indemnitor_printed_name: Optional[str] = None
    indemnitor_signature_date: Optional[str] = None


class SignatureTokenResponse(BaseModel):
    case_id: str
    defendant_name: str
    bond_amount: float
    advisor_name: Optional[str]
    expires_at: datetime


# Advisor endpoint to send signature request
@router.post("/cases/{case_id}/send-remote-signature")
def send_signature_request(
    case_id: str,
    request: SendSignatureRequest,
    db: Session = Depends(get_db)
):
    """Send remote signature request email to client"""
    # Get case
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Create signature token
    token = SignatureToken(
        case_id=case_id,
        email=request.email
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    
    # Generate signature link
    signature_link = f"{settings.FRONTEND_URL}/signature/{token.token}"
    
    # Send email
    defendant_name = f"{case.defendant_first_name} {case.defendant_last_name}"
    advisor_name = case.advisor_id or "Your Advisor"  # TODO: Get actual advisor name
    
    email_sent = EmailService.send_signature_request(
        to_email=request.email,
        case_id=case_id,
        defendant_name=defendant_name,
        bond_amount=float(case.bond_amount),
        advisor_name=advisor_name,
        signature_link=signature_link
    )
    
    if not email_sent:
        raise HTTPException(
            status_code=500,
            detail="Failed to send signature request email"
        )
    
    # Update case
    case.client_email_for_remote = request.email
    case.remote_acknowledgment_sent = "YES"
    db.commit()
    
    return {
        "success": True,
        "message": "Signature request sent successfully",
        "token": token.token,
        "expires_at": token.expires_at
    }


# Public endpoint to get signature page data
@router.get("/public/signature/{token}", response_model=SignatureTokenResponse)
def get_signature_page(token: str, db: Session = Depends(get_db)):
    """Get case data for signature page (public endpoint)"""
    # Find token
    signature_token = db.query(SignatureToken).filter(
        SignatureToken.token == token
    ).first()
    
    if not signature_token:
        raise HTTPException(status_code=404, detail="Invalid signature link")
    
    # Check if token is valid
    if not signature_token.is_valid():
        if signature_token.used_at:
            raise HTTPException(status_code=400, detail="This signature link has already been used")
        else:
            raise HTTPException(status_code=400, detail="This signature link has expired")
    
    # Get case
    case = db.query(CaseModel).filter(CaseModel.id == signature_token.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    defendant_name = f"{case.defendant_first_name} {case.defendant_last_name}"
    
    return SignatureTokenResponse(
        case_id=case.id,
        defendant_name=defendant_name,
        bond_amount=float(case.bond_amount),
        advisor_name=case.advisor_id,  # TODO: Get actual advisor name
        expires_at=signature_token.expires_at
    )


# Public endpoint to submit signatures
@router.post("/public/signature/{token}/submit")
def submit_signatures(
    token: str,
    submission: SignatureSubmission,
    db: Session = Depends(get_db)
):
    """Submit signatures (public endpoint)"""
    # Find token
    signature_token = db.query(SignatureToken).filter(
        SignatureToken.token == token
    ).first()
    
    if not signature_token:
        raise HTTPException(status_code=404, detail="Invalid signature link")
    
    # Check if token is valid
    if not signature_token.is_valid():
        if signature_token.used_at:
            raise HTTPException(status_code=400, detail="This signature link has already been used")
        else:
            raise HTTPException(status_code=400, detail="This signature link has expired")
    
    # Get case
    case = db.query(CaseModel).filter(CaseModel.id == signature_token.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Update case with signatures
    if submission.terms_signature:
        case.terms_signature = submission.terms_signature
    if submission.fee_disclosure_signature:
        case.fee_disclosure_signature = submission.fee_disclosure_signature
    if submission.contact_agreement_signature:
        case.contact_agreement_signature = submission.contact_agreement_signature
    if submission.indemnitor_signature:
        case.indemnitor_signature = submission.indemnitor_signature
    if submission.indemnitor_printed_name:
        case.indemnitor_printed_name = submission.indemnitor_printed_name
    if submission.indemnitor_signature_date:
        case.indemnitor_signature_date = submission.indemnitor_signature_date
    
    # Mark token as used
    signature_token.mark_as_used()
    
    # Update case state if needed
    case.remote_acknowledgment_sent = "COMPLETED"
    
    db.commit()
    
    logger.info(f"Signatures submitted for case {case.id} via token {token}")
    
    return {
        "success": True,
        "message": "Signatures submitted successfully"
    }
