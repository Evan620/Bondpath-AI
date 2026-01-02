from sqlalchemy import create_engine, text
from app.config import settings

def migrate():
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        print("Adding contact_method column to cases table...")
        try:
            conn.execute(text("ALTER TABLE cases ADD COLUMN contact_method VARCHAR"))
            conn.commit()
            print("Successfully added contact_method column.")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    migrate()
