from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.case import Case as CaseModel

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/advisors")
def get_advisors_with_workload(db: Session = Depends(get_db)):
    """Get all advisors with their current active case count."""
    # Get all users with PRODUCER role
    advisors = db.query(User).filter(User.role == "PRODUCER").all()
    
    result = []
    for advisor in advisors:
        # Count active cases assigned to this advisor
        active_count = db.query(CaseModel).filter(
            CaseModel.assigned_to == advisor.id,
            CaseModel.state.in_(['QUALIFIED', 'ADVISOR_ACTIVE'])
        ).count()
        
        result.append({
            "id": advisor.id,
            "email": advisor.email,
            "active_cases": active_count
        })
    
    return result

@router.get("/underwriters")
def get_underwriters_with_workload(db: Session = Depends(get_db)):
    """Get all underwriters with their current active case count."""
    # Get all users with UW role
    underwriters = db.query(User).filter(User.role == "UW").all()
    
    result = []
    for uw in underwriters:
        # Count active cases assigned to this underwriter
        active_count = db.query(CaseModel).filter(
            CaseModel.assigned_to == uw.id,
            CaseModel.state == 'UNDERWRITING_REVIEW'
        ).count()
        
        result.append({
            "id": uw.id,
            "email": uw.email,
            "active_cases": active_count
        })
    
    return result
