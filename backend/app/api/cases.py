from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List, Dict
from ..database import get_db
import os
import shutil
from datetime import datetime, date
from decimal import Decimal
from ..models.case import Case as CaseModel
from ..schemas.case import Case, CaseCreate, CaseUpdate
from ..api.auth import oauth2_scheme 
from ..orchestrator.graph import app as orchestrator_app
from ..orchestrator.state import CaseState
import uuid

router = APIRouter(prefix="/cases", tags=["cases"])

@router.post("/", response_model=Case)
def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    db_case = CaseModel(
        id=str(uuid.uuid4()),
        state="INTAKE",
        # Defendant Identity
        defendant_first_name=case.defendant_first_name,
        defendant_last_name=case.defendant_last_name,
        defendant_dob=case.defendant_dob,
        defendant_gender=case.defendant_gender,
        # Incarceration Details
        jail_facility=case.jail_facility,
        county=case.county,
        state_jurisdiction=case.state_jurisdiction,
        booking_number=case.booking_number,
        # Bond Information
        bond_amount=case.bond_amount,
        bond_type=case.bond_type,
        charge_severity=case.charge_severity,
        # Caller Info
        caller_name=case.caller_name,
        caller_relationship=case.caller_relationship,
        caller_phone=case.caller_phone,
        caller_phone_secondary=case.caller_phone_secondary,
        caller_email=case.caller_email,
        # Intent Signal
        intent_signal=case.intent_signal,
        # Fast Flags
        fast_flags=case.fast_flags,
        # System fields
        derived_facts={},
        decisions=[]
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)

    # --- Trigger Orchestrator ---
    try:
        initial_state = CaseState(
            case_id=str(db_case.id),
            current_state=db_case.state,
            facts={
                "defendant_name": f"{db_case.defendant_first_name} {db_case.defendant_last_name}",
                "bond_amount": float(db_case.bond_amount),
                "bond_type": db_case.bond_type,
                "charge_severity": db_case.charge_severity,
                "county": db_case.county,
                "state": db_case.state_jurisdiction,
                "intent_signal": db_case.intent_signal,
                "fast_flags": db_case.fast_flags
            },
            derived_facts={},
            blockers=[],
            next_actions=[],
            agent_outputs={},
            rule_results={},
            history=[]
        )
        
        final_state = orchestrator_app.invoke(initial_state)
        
        # Update DB with results
        db_case.state = final_state['current_state']
        
        # Persist rule results and history
        if final_state.get('rule_results'):
            db_case.decisions = [final_state['rule_results']]
        
        # Persist derived facts (Intake output)
        if final_state.get('agent_outputs'):
            db_case.derived_facts = final_state['agent_outputs']
    
    except Exception as e:
        print(f"Orchestrator error: {e}")
        # Case still created, just mark as INTAKE (manual processing needed)
        db_case.state = "INTAKE"

    db.commit()
    db.refresh(db_case)
    
    return db_case


@router.get("/", response_model=List[Case])
def read_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cases = db.query(CaseModel).offset(skip).limit(limit).all()
    return cases

@router.get("/{case_id}", response_model=Case)
def read_case(case_id: str, db: Session = Depends(get_db)):
    db_case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if db_case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return db_case

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/{case_id}/documents")
async def upload_document(
    case_id: str, 
    request: Request,
    file: UploadFile = File(...), 
    document_type: str = "other", 
    db: Session = Depends(get_db)
):
    db_case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if db_case is None:
        raise HTTPException(status_code=404, detail="Case not found")
        
    # Secure filename
    safe_filename = "".join(x for x in file.filename if x.isalnum() or x in "._-")
    file_path = os.path.join(UPLOAD_DIR, f"{case_id}_{document_type}_{safe_filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # URL construction
    base_url = str(request.base_url).rstrip("/")
    file_url = f"{base_url}/static/{os.path.basename(file_path)}"
    
    # Update model automatically
    if document_type == "booking_sheet":
        db_case.booking_sheet_url = file_url
    elif document_type == "defendant_id":
        db_case.defendant_id_url = file_url
    elif document_type == "indemnitor_id":
        db_case.indemnitor_id_url = file_url
    elif document_type == "gov_id":
        db_case.gov_id_url = file_url
    elif document_type == "collateral_doc":
        db_case.collateral_doc_url = file_url
        
    # Trigger AI Verification
    try:
        # Convert case to dict for agent
        case_data = {
            "defendant_first_name": db_case.defendant_first_name,
            "defendant_last_name": db_case.defendant_last_name,
            "defendant_dob": db_case.defendant_dob,
            "booking_number": db_case.booking_number,
            "charges": db_case.charges
        }
        
        verification_result = doc_verify_agent.run({
            "file_url": file_path, # Pass absolute path
            "case_data": case_data,
            "doc_type": document_type
        })
        
        # Update verified status
        current_verified = dict(db_case.documents_verified) if db_case.documents_verified else {}
        current_verified[document_type] = verification_result
        db_case.documents_verified = current_verified
        
    except Exception as e:
        print(f"Verification failed: {e}")
        # Don't fail the upload just because AI didn't work
        pass
        
    db.commit()
    return {
        "url": file_url, 
        "filename": file.filename,
        "verification": db_case.documents_verified.get(document_type)
    }

@router.patch("/{case_id}", response_model=Case)
def update_case(case_id: str, case_update: CaseUpdate, db: Session = Depends(get_db)):
    """Update case fields (used by Advisor and Underwriter)."""
    db_case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if db_case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Update only provided fields
    update_data = case_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_case, field, value)
    
    db.commit()
    db.refresh(db_case)
    return db_case

@router.post("/{case_id}/assess-risk", response_model=Dict)
def reassess_risk(case_id: str, db: Session = Depends(get_db)):
    """
    Re-run the AI risk assessment with current complete case data.
    Called when Advisor submits case to Underwriter.
    """
    from ..agents.risk import risk_agent
    
    db_case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if db_case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Build comprehensive facts dictionary with ALL available case data
    facts = {
        # Defendant Information
        "defendant_first_name": db_case.defendant_first_name,
        "defendant_last_name": db_case.defendant_last_name,
        "defendant_name": f"{db_case.defendant_first_name} {db_case.defendant_last_name}",
        "defendant_dob": str(db_case.defendant_dob) if db_case.defendant_dob else None,
        "defendant_gender": db_case.defendant_gender,
        "defendant_ssn_last4": db_case.defendant_ssn_last4,
        # Fields not currently in DB model, optional for now
        # "defendant_phone": db_case.defendant_phone,
        # "defendant_email": db_case.defendant_email,
        # "defendant_address": db_case.defendant_address,
        # "defendant_city": db_case.defendant_city,
        # "defendant_state": db_case.defendant_state,
        # "defendant_zip": db_case.defendant_zip,
        # "defendant_employer": db_case.defendant_employer,
        # "defendant_occupation": db_case.defendant_occupation,
        
        # Incarceration Details
        "jail_facility": db_case.jail_facility,
        "county": db_case.county,
        "state_jurisdiction": db_case.state_jurisdiction,
        "booking_number": db_case.booking_number,
        
        # Bond Information
        "bond_amount": float(db_case.bond_amount) if db_case.bond_amount else 0,
        "bond_type": db_case.bond_type,
        "charges": db_case.charges,
        "charge_severity": db_case.charge_severity,
        
        # Indemnitor Information (Critical for risk assessment)
        "indemnitor_first_name": db_case.indemnitor_first_name,
        "indemnitor_last_name": db_case.indemnitor_last_name,
        "indemnitor_relationship": db_case.indemnitor_relationship,
        "indemnitor_phone": db_case.indemnitor_phone,
        "indemnitor_email": db_case.indemnitor_email,
        "indemnitor_address": db_case.indemnitor_address,
        # Fields not currently in DB model
        # "indemnitor_city": db_case.indemnitor_city,
        # "indemnitor_state": db_case.indemnitor_state,
        # "indemnitor_zip": db_case.indemnitor_zip,
        # "indemnitor_employer": db_case.indemnitor_employer,
        # "indemnitor_occupation": db_case.indemnitor_occupation,
        # "indemnitor_ssn_last4": db_case.indemnitor_ssn_last4,
        
        # Financial Information
        "premium_type": db_case.premium_type,
        "payment_method": db_case.payment_method,
        "down_payment_amount": float(db_case.down_payment_amount) if db_case.down_payment_amount else 0,
        
        # Document Availability (affects risk)
        "has_booking_sheet": bool(db_case.booking_sheet_url),
        "has_defendant_id": bool(db_case.defendant_id_url),
        "has_indemnitor_id": bool(db_case.indemnitor_id_url),
        "has_gov_id": bool(db_case.gov_id_url),
        "has_collateral_doc": bool(db_case.collateral_doc_url),
        
        # Caller Information
        "caller_name": db_case.caller_name,
        "caller_relationship": db_case.caller_relationship,
        
        # Intent & Flags
        "intent_signal": db_case.intent_signal,
        "fast_flags": db_case.fast_flags,
    }
    
    try:
        # Run risk assessment with complete data
        risk_output = risk_agent.run(facts)
        print(f"DEBUG: Risk Agent Output: {risk_output}")
        
        # Update derived_facts with new risk assessment
        # Create a new dictionary to ensure SQLAlchemy detects the change
        current_facts = dict(db_case.derived_facts) if db_case.derived_facts else {}
        current_facts['risk'] = risk_output
        db_case.derived_facts = current_facts
        
        db.commit()
        db.refresh(db_case)
        
        return {
            "success": True,
            "derived_facts": db_case.derived_facts,
            "updated_at": db_case.updated_at,
            "message": "Risk assessment completed successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Risk assessment failed: {str(e)}"
        )

@router.post("/{case_id}/check-readiness")
def check_case_readiness(case_id: str, db: Session = Depends(get_db)):
    """
    Run AI readiness check to see if the case is ready for underwriter review.
    """
    db_case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    try:
        # Build comprehensive facts dictionary (reuse logic from reassess_risk or extract to helper)
        # For now, we dump the model to dict, but specialized formatting helps the AI
        case_data = {c.name: getattr(db_case, c.name) for c in db_case.__table__.columns}
        
        # Clean dates/decimals for JSON serialization
        # (Pydantic/JSON encoder usually handles this, but agents prefer clean strings)
        for k, v in case_data.items():
            if isinstance(v, (datetime, date)):
                case_data[k] = v.isoformat()
            if isinstance(v, Decimal):
                case_data[k] = float(v)

        # Run Agent
        readiness_output = readiness_agent.run(case_data)
        
        # Update derived_facts
        current_facts = dict(db_case.derived_facts) if db_case.derived_facts else {}
        current_facts['readiness'] = readiness_output
        db_case.derived_facts = current_facts
        
        db.commit()
        db.refresh(db_case)
        
        return {
            "success": True,
            "readiness": readiness_output
        }
        
    except Exception as e:
        print(f"Readiness check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

