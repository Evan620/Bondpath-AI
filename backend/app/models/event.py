from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON
import uuid
from datetime import datetime
from ..database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"), index=True, nullable=False)
    event_type = Column(String, nullable=False)
    actor_id = Column(String, nullable=True) # Could be User ID or System/Agent
    actor_role = Column(String, nullable=False)
    payload = Column(JSON, default={})
    rule_applied = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now, index=True)
    version = Column(Integer, nullable=False) # Case version at time of event
