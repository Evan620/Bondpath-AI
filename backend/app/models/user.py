from sqlalchemy import Column, String, DateTime
import uuid
from datetime import datetime
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # CST, PRODUCER, UW, ADMIN
    created_at = Column(DateTime, default=datetime.now)
