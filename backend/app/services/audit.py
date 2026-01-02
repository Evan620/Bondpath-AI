from sqlalchemy.orm import Session
from ..models.audit import AuditLog

class AuditService:
    @staticmethod
    def log_action(db: Session, case_id: str, action: str, details: dict = None, performed_by: str = "SYSTEM"):
        """
        Log an action for a specific case.
        """
        try:
            log_entry = AuditLog(
                case_id=case_id,
                action=action,
                details=details or {},
                performed_by=performed_by
            )
            db.add(log_entry)
            db.commit()
            return log_entry
        except Exception as e:
            # Fallback: In a real system, we might log to file or stderr so audit failure doesn't crash the transaction
            # monitoring.log_error(f"Audit Log Failed: {e}")
            print(f"CRITICAL: Failed to write audit log: {e}")
            db.rollback()
            return None
