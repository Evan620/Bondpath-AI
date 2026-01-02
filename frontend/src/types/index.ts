export interface User {
    id: string;
    email: string;
    role: 'CST' | 'ADVISOR' | 'UW' | 'ADMIN';
}

export interface Case {
    id: string;
    state: string;
    assigned_to?: string;

    // Defendant Identity
    defendant_first_name: string;
    defendant_last_name: string;
    defendant_dob?: string;
    defendant_gender?: string;

    // Incarceration Details
    jail_facility: string;
    county: string;
    state_jurisdiction: string;
    booking_number?: string;

    // Bond Information
    bond_amount: number;
    bond_type: 'SURETY' | 'CASH' | 'PR' | 'UNKNOWN';
    charge_severity: 'MISDEMEANOR' | 'FELONY' | 'UNKNOWN';

    // Caller Info
    caller_name: string;
    caller_relationship: string;
    caller_phone: string;
    caller_phone_secondary?: string;
    caller_email?: string;

    // Intent & Flags
    intent_signal: string;
    fast_flags: string[];

    // System fields
    derived_facts: Record<string, any>;
    decisions: any[];
    created_at: string;
    updated_at: string;
    version: number;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    role: string;
    user_id: string;
}
