from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
from app.database import Base


class SignatureToken(Base):
    __tablename__ = "signature_tokens"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(days=7))
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    case = relationship("Case", back_populates="signature_tokens")

    def is_valid(self) -> bool:
        """Check if token is valid (not expired and not used)"""
        now = datetime.utcnow()
        return self.expires_at > now and self.used_at is None

    def mark_as_used(self):
        """Mark token as used"""
        self.used_at = datetime.utcnow()
