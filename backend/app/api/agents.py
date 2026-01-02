from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.case import Case as CaseModel
from ..agents.readiness import readiness_agent, ReadinessOutput
from ..agents.doc_verify import doc_verify_agent, DocVerificationOutput
from pydantic import BaseModel
import logging

router = APIRouter(prefix="/agents", tags=["agents"])
logger = logging.getLogger(__name__)

class DocVerifyRequest(BaseModel):
    case_id: str
    doc_type: str
    file_url: str

@router.post("/readiness/{case_id}", response_model=ReadinessOutput)
def check_readiness(case_id: str, db: Session = Depends(get_db)):
    """
    Run AI readiness check on a case.
    """
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Convert case to dict for agent
    # We need to serialize the SQLAlchemy model to a dict
    # This is a bit manual to ensure we get what we need
    case_data = {
        "id": case.id,
        "defendant_first_name": case.defendant_first_name,
        "defendant_last_name": case.defendant_last_name,
        "charges": case.charges,
        "bond_amount": float(case.bond_amount) if case.bond_amount else 0,
        "jail_facility": case.jail_facility,
        "indemnitor_first_name": getattr(case, 'indemnitor_first_name', None), # Might not be in model yet if added dynamically? Assuming it is or in derived_facts
        "indemnitor_last_name": getattr(case, 'indemnitor_last_name', None),
        # Add other relevant fields map
        # Ideally we'd use Pydantic's from_orm but simplified here
    }
    
    # If fields like indemnitor info are stored in JSON or elsewhere, ensure we extract them
    # For now assuming basic fields mapped in Case model
    
    try:
        result = readiness_agent.run(case_data)
        return result
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-doc", response_model=DocVerificationOutput)
def verify_document(request: DocVerifyRequest, db: Session = Depends(get_db)):
    """
    Run AI document verification.
    """
    case = db.query(CaseModel).filter(CaseModel.id == request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    case_data = {
        "defendant_name": f"{case.defendant_first_name} {case.defendant_last_name}",
        "dob": getattr(case, 'defendant_dob', None),
        "booking_number": getattr(case, 'booking_number', None),
        "bond_amount": float(case.bond_amount) if case.bond_amount else 0,
        "charges": case.charges
    }
    
    input_data = {
        "image_url": request.file_url,
        "case_data": case_data,
        "doc_type": request.doc_type
    }
    
    try:
        result = doc_verify_agent.run(input_data)
        return result
    except Exception as e:
        logger.error(f"Doc verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
