from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON
import uuid
from datetime import datetime
from ..database import Base

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"), index=True, nullable=False)
    decision_type = Column(String, nullable=False) # APPROVAL, DENIAL, HOLD
    rationale = Column(Text, nullable=False)
    facts_at_decision = Column(JSON, nullable=False)
    rule_version = Column(String, nullable=True)
    made_by = Column(String, nullable=True) # User ID
    made_at = Column(DateTime, default=datetime.now)
    overridden = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
