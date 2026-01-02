from sqlalchemy import Column, String, DECIMAL, DateTime, Integer, JSON, Date
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    state = Column(String, index=True, nullable=False)
    assigned_to = Column(String, nullable=True)  # User ID of current assignee
    advisor_id = Column(String, nullable=True)   # User ID of the primary advisor assigned
    
    # Defendant Identity
    defendant_first_name = Column(String, nullable=False)
    defendant_last_name = Column(String, nullable=False)
    defendant_dob = Column(String, nullable=True)  # Can be date or age string
    defendant_gender = Column(String, nullable=True)
    
    # Incarceration Details
    jail_facility = Column(String, nullable=False)
    county = Column(String, nullable=False)
    state_jurisdiction = Column(String, nullable=False)
    booking_number = Column(String, nullable=True)
    
    # Bond Information
    bond_amount = Column(DECIMAL(10, 2), nullable=False)
    bond_type = Column(String, nullable=False)  # SURETY, CASH, PR, UNKNOWN
    charge_severity = Column(String, nullable=False)  # MISDEMEANOR, FELONY, UNKNOWN
    
    # Caller/Contact Info
    caller_name = Column(String, nullable=False)
    caller_relationship = Column(String, nullable=False)
    caller_phone = Column(String, nullable=False)
    caller_phone_secondary = Column(String, nullable=True)
    caller_email = Column(String, nullable=True)
    
    # Intent Signal (CRITICAL for orchestration)
    intent_signal = Column(String, nullable=False)  # CHECKING_COST, GET_OUT_TODAY, GATHERING_INFO, UNSURE
    
    # Fast Flags (optional observational data)
    fast_flags = Column(JSON, default=[])  # Array of strings
    
    # ADVISOR SECTION FIELDS
    # Engagement Type
    engagement_type = Column(String, nullable=True)  # QUOTE_ONLY, PROCEED_NOW
    contact_method = Column(String, nullable=True)   # IN_PERSON, REMOTE
    
    # Premium & Payment
    premium_type = Column(String, nullable=True)  # FULL_PREMIUM, PAYMENT_PLAN, DEFERRED
    down_payment_amount = Column(DECIMAL(10, 2), nullable=True)
    monthly_payment_amount = Column(DECIMAL(10, 2), nullable=True)
    payment_method = Column(String, nullable=True)  # CASH, CARD, BANK_TRANSFER, etc.
    
    # Collateral
    collateral_description = Column(String, nullable=True)
    has_collateral = Column(String, nullable=True)  # YES, NO, UNSURE
    
    # Indemnitor Information
    indemnitor_first_name = Column(String, nullable=True)
    indemnitor_last_name = Column(String, nullable=True)
    indemnitor_phone = Column(String, nullable=True)
    indemnitor_email = Column(String, nullable=True)
    indemnitor_address = Column(String, nullable=True)
    indemnitor_relationship = Column(String, nullable=True)
    
    # Defendant Full Details (from Advisor)
    defendant_ssn_last4 = Column(String, nullable=True)
    charges = Column(String, nullable=True)  # Text description of charges
    
    # Signatures & Agreements
    signatures_status = Column(JSON, default={})  # Track which signatures completed
    terms_signature = Column(String, nullable=True) # Base64
    fee_disclosure_signature = Column(String, nullable=True) # Base64
    contact_agreement_signature = Column(String, nullable=True) # Base64
    indemnitor_signature = Column(String, nullable=True) # Base64
    indemnitor_printed_name = Column(String, nullable=True)
    indemnitor_signature_date = Column(String, nullable=True)
    co_signer_name = Column(String, nullable=True)
    co_signer_phone = Column(String, nullable=True)
    co_signer_signature = Column(String, nullable=True) # Base64
    deferred_payment_auth_signature = Column(String, nullable=True) # Base64
    
    # Documents
    booking_sheet_url = Column(String, nullable=True)
    defendant_id_url = Column(String, nullable=True)
    indemnitor_id_url = Column(String, nullable=True)
    gov_id_url = Column(String, nullable=True)
    collateral_doc_url = Column(String, nullable=True)

    remote_acknowledgment_sent = Column(String, nullable=True)  # YES, NO
    client_email_for_remote = Column(String, nullable=True)
    
    # Advisor Notes
    advisor_notes = Column(String, nullable=True)
    advisor_next_step = Column(String, nullable=True)  # TRANSFER_TO_UW, SCHEDULE_FOLLOWUP, CONTINUE
    
    # UNDERWRITER SECTION FIELDS
    uw_name = Column(String, nullable=True)
    uw_review_date = Column(Date, nullable=True)
    uw_decision = Column(String, nullable=True)  # APPROVED, HOLD, DENIED
    uw_reason = Column(String, nullable=True)  # Reason for Hold/Denial
    documents_verified = Column(JSON, default={})  # Track which docs verified
    
    # Post-Execution (if Approved)
    paid_in_full = Column(String, nullable=True)  # YES, NO
    initial_deposit_amount = Column(DECIMAL(10, 2), nullable=True)
    power_number = Column(String, nullable=True)  # Official bond document number
    court_case_number = Column(String, nullable=True)
    
    # System fields
    derived_facts = Column(JSON, default={})  # AI agent outputs
    decisions = Column(JSON, default=[])  # Rule results    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    signature_tokens = relationship("SignatureToken", back_populates="case", cascade="all, delete-orphan")
    version = Column(Integer, default=1)
