from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

columns = [
    "terms_signature",
    "fee_disclosure_signature",
    "contact_agreement_signature",
    "indemnitor_signature",
    "indemnitor_printed_name",
    "indemnitor_signature_date",
    "co_signer_name",
    "co_signer_phone",
    "co_signer_signature",
    "deferred_payment_auth_signature",
    "booking_sheet_url",
    "defendant_id_url",
    "indemnitor_id_url",
    "gov_id_url",
    "collateral_doc_url",
    "remote_acknowledgment_sent",
    "client_email_for_remote"
]

def migrate():
    with engine.connect() as conn:
        for col in columns:
            try:
                logger.info(f"Adding column {col}...")
                conn.execute(text(f"ALTER TABLE cases ADD COLUMN {col} VARCHAR"))
                conn.commit()
                logger.info(f"Successfully added {col}.")
            except Exception as e:
                logger.warning(f"Error adding {col} (might already exist): {e}")

if __name__ == "__main__":
    migrate()
