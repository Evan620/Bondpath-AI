from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.utils import get_password_hash
import uuid

def seed():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    users = [
        {"email": "admin@bondpath.com", "role": "ADMIN", "password": "password123"},
        {"email": "cst@bondpath.com", "role": "CST", "password": "password123"},
        {"email": "advisor1@bondpath.com", "role": "PRODUCER", "password": "password123"},
        {"email": "advisor2@bondpath.com", "role": "PRODUCER", "password": "password123"},
        {"email": "uw@bondpath.com", "role": "UW", "password": "password123"}
    ]
    
    try:
        for u in users:
            existing_user = db.query(User).filter(User.email == u["email"]).first()
            if not existing_user:
                new_user = User(
                    id=str(uuid.uuid4()),
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    role=u["role"]
                )
                db.add(new_user)
                print(f"Created user: {u['email']} ({u['role']})")
            else:
                print(f"User already exists: {u['email']}")
        
        db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
