from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    with engine.connect() as conn:
        try:
            # Add the column
            conn.execute(text("ALTER TABLE cases ADD COLUMN advisor_id VARCHAR"))
            conn.commit()
            logger.info("Column advisor_id added successfully.")
            
            # Backfill likely advisor IDs based on assigned_to if state matches
            # This is a heuristic: if state is ADVISOR_ACTIVE, assigned_to IS the advisor
            conn.execute(text("UPDATE cases SET advisor_id = assigned_to WHERE state = 'ADVISOR_ACTIVE'"))
            conn.commit()
            logger.info("Backfilled advisor_id for active advisor cases.")
            
        except Exception as e:
            logger.error(f"Migration error (column might already exist): {e}")

if __name__ == "__main__":
    migrate()
