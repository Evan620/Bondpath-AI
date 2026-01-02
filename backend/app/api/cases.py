from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List, Dict
from ..database import get_db
import os
import shutil
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
        
    db.commit()
    return {"url": file_url, "filename": file.filename}

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
