from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
import uuid
from datetime import datetime
from ..database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, index=True)
    action = Column(String, nullable=False, index=True)
    details = Column(JSON, default={})
    performed_by = Column(String, default="SYSTEM")
    timestamp = Column(DateTime, default=datetime.now, index=True)
