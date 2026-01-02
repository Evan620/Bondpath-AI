from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.utils import get_password_hash
import uuid

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # CST User
        if not db.query(User).filter(User.email == "cst@example.com").first():
            user = User(
                id=str(uuid.uuid4()),
                email="cst@example.com",
                hashed_password=get_password_hash("admin123"),
                role="CST"
            )
            db.add(user)
            print("Created CST user: cst@example.com")
        
        # Advisor User
        if not db.query(User).filter(User.email == "advisor@example.com").first():
            user = User(
                id=str(uuid.uuid4()),
                email="advisor@example.com",
                hashed_password=get_password_hash("admin123"),
                role="PRODUCER"
            )
            db.add(user)
            print("Created Advisor user: advisor@example.com")
        
        # Underwriter User
        if not db.query(User).filter(User.email == "underwriter@example.com").first():
            user = User(
                id=str(uuid.uuid4()),
                email="underwriter@example.com",
                hashed_password=get_password_hash("admin123"),
                role="UW"
            )
            db.add(user)
            print("Created Underwriter user: underwriter@example.com")
        
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
