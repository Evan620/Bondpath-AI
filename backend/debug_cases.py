
from app.database import SessionLocal
from app.models.case import Case
from app.models.user import User

db = SessionLocal()
cases = db.query(Case).all()
users = db.query(User).all()

print("\n--- USERS ---")
print(f"{'ID':<36} | {'Email':<30} | {'Role':<10}")
print("-" * 80)
for user in users:
    print(f"{user.id:<36} | {user.email:<30} | {user.role:<10}")

print("\n--- CASES ---")
print(f"{'ID':<36} | {'State':<15} | {'Assigned To':<36}")
print("-" * 90)
for case in cases:
    print(f"{case.id:<36} | {case.state:<15} | {str(case.assigned_to):<36}")
db.close()
