from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime
from decimal import Decimal

class CaseBase(BaseModel):
    # Defendant Identity
    defendant_first_name: str
    defendant_last_name: str
    defendant_dob: Optional[str] = None
    defendant_gender: Optional[str] = None
    
    # Incarceration Details
    jail_facility: str
    county: str
    state_jurisdiction: str
    booking_number: Optional[str] = None
    
    # Bond Information
    bond_amount: Decimal
    bond_type: str  # SURETY, CASH, PR, UNKNOWN
    charge_severity: str  # MISDEMEANOR, FELONY, UNKNOWN
    
    # Caller/Contact Info
    caller_name: str
    caller_relationship: str
    caller_phone: str
    caller_phone_secondary: Optional[str] = None
    caller_email: Optional[str] = None
    
    # Intent Signal
    intent_signal: str  # CHECKING_COST, GET_OUT_TODAY, GATHERING_INFO, UNSURE
    
    # Fast Flags
    fast_flags: List[str] = []
    
    # Assignment
    assigned_to: Optional[str] = None  # User ID of assigned advisor
    advisor_id: Optional[str] = None   # User ID of the primary advisor assigned
    
    # ADVISOR FIELDS
    engagement_type: Optional[str] = None
    premium_type: Optional[str] = None
    down_payment_amount: Optional[Decimal] = None
    monthly_payment_amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    collateral_description: Optional[str] = None
    has_collateral: Optional[str] = None
    indemnitor_first_name: Optional[str] = None
    indemnitor_last_name: Optional[str] = None
    indemnitor_phone: Optional[str] = None
    indemnitor_email: Optional[str] = None
    indemnitor_address: Optional[str] = None
    indemnitor_relationship: Optional[str] = None
    defendant_ssn_last4: Optional[str] = None
    charges: Optional[str] = None
    signatures_status: Dict[str, Any] = {}
    remote_acknowledgment_sent: Optional[str] = None
    client_email_for_remote: Optional[str] = None
    advisor_notes: Optional[str] = None
    advisor_next_step: Optional[str] = None
    
    # Signatures
    terms_signature: Optional[str] = None
    fee_disclosure_signature: Optional[str] = None
    contact_agreement_signature: Optional[str] = None
    indemnitor_signature: Optional[str] = None
    indemnitor_printed_name: Optional[str] = None
    indemnitor_signature_date: Optional[str] = None
    co_signer_name: Optional[str] = None
    co_signer_phone: Optional[str] = None
    co_signer_signature: Optional[str] = None
    deferred_payment_auth_signature: Optional[str] = None

    # Documents
    booking_sheet_url: Optional[str] = None
    defendant_id_url: Optional[str] = None
    indemnitor_id_url: Optional[str] = None
    gov_id_url: Optional[str] = None
    collateral_doc_url: Optional[str] = None
    
    # UNDERWRITER FIELDS
    uw_name: Optional[str] = None
    uw_review_date: Optional[str] = None
    uw_decision: Optional[str] = None
    uw_reason: Optional[str] = None
    documents_verified: Dict[str, Any] = {}
    paid_in_full: Optional[str] = None
    initial_deposit_amount: Optional[Decimal] = None
    power_number: Optional[str] = None
    court_case_number: Optional[str] = None

class CaseCreate(CaseBase):
    pass

class CaseUpdate(BaseModel):
    derived_facts: Optional[Dict[str, Any]] = None
    state: Optional[str] = None
    assigned_to: Optional[str] = None
    advisor_id: Optional[str] = None
    
    # Allow updating any Advisor/UW fields
    engagement_type: Optional[str] = None
    contact_method: Optional[str] = None
    premium_type: Optional[str] = None
    down_payment_amount: Optional[Decimal] = None
    monthly_payment_amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    collateral_description: Optional[str] = None
    has_collateral: Optional[str] = None
    indemnitor_first_name: Optional[str] = None
    indemnitor_last_name: Optional[str] = None
    indemnitor_phone: Optional[str] = None
    indemnitor_email: Optional[str] = None
    indemnitor_address: Optional[str] = None
    indemnitor_relationship: Optional[str] = None
    defendant_ssn_last4: Optional[str] = None
    charges: Optional[str] = None
    signatures_status: Optional[Dict[str, Any]] = None
    remote_acknowledgment_sent: Optional[str] = None
    client_email_for_remote: Optional[str] = None
    advisor_notes: Optional[str] = None
    advisor_next_step: Optional[str] = None

    # Signatures
    terms_signature: Optional[str] = None
    fee_disclosure_signature: Optional[str] = None
    contact_agreement_signature: Optional[str] = None
    indemnitor_signature: Optional[str] = None
    indemnitor_printed_name: Optional[str] = None
    indemnitor_signature_date: Optional[str] = None
    co_signer_name: Optional[str] = None
    co_signer_phone: Optional[str] = None
    co_signer_signature: Optional[str] = None
    deferred_payment_auth_signature: Optional[str] = None

    # Documents
    booking_sheet_url: Optional[str] = None
    defendant_id_url: Optional[str] = None
    indemnitor_id_url: Optional[str] = None
    gov_id_url: Optional[str] = None
    collateral_doc_url: Optional[str] = None
    
    uw_name: Optional[str] = None
    uw_review_date: Optional[str] = None
    uw_decision: Optional[str] = None
    uw_reason: Optional[str] = None
    documents_verified: Optional[Dict[str, Any]] = None
    paid_in_full: Optional[str] = None
    initial_deposit_amount: Optional[Decimal] = None
    power_number: Optional[str] = None
    court_case_number: Optional[str] = None

class Case(CaseBase):
    id: str
    state: str
    derived_facts: Dict[str, Any]
    decisions: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    version: int

    class Config:
        from_attributes = True
