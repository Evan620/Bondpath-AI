from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from ..database import get_db
from ..models.case import Case
from ..agents.chat import chat_agent
from ..api.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    case_id: Optional[str] = None
    page_context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    suggested_actions: list[str]

@router.post("/message", response_model=ChatResponse)
async def chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        context = {
            "page": request.page_context,
            "user_role": current_user.get("role")
        }
        
        # If case_id is provided, fetch case details
        if request.case_id:
            case = db.query(Case).filter(Case.id == request.case_id).first()
            if case:
                # Construct a summary of the case for the agent
                case_summary = {
                    "id": case.id,
                    "defendant": f"{case.defendant_first_name} {case.defendant_last_name}",
                    "charges": case.charges,
                    "bond_amount": case.bond_amount,
                    "status": case.state,
                    "risk_assessment": case.derived_facts.get('risk') if case.derived_facts else None,
                    "missing_info": case.derived_facts.get('missing_info', []) if case.derived_facts else []
                }
                context["vehicle_case"] = case_summary
        
        # Run the agent
        result = chat_agent.run(
            query=request.message,
            context=context,
            role=current_user.get("role")
        )
        
        return result
        
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
