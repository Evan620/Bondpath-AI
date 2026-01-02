from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models.audit import AuditLog

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogSchema(BaseModel):
    id: str
    case_id: str
    action: str
    details: dict
    performed_by: str
    timestamp: datetime

    class Config:
        orm_mode = True

@router.get("/case/{case_id}", response_model=List[AuditLogSchema])
def get_case_audit_logs(case_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all audit logs for a specific case.
    """
    logs = db.query(AuditLog).filter(AuditLog.case_id == case_id).order_by(AuditLog.timestamp.desc()).all()
    return logs
