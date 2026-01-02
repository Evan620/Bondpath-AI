import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_test():
    unique_name = f"Audit-{int(time.time())}"
    print(f"Creating new case for: {unique_name}")
    
    case_data = {
        "defendant_first_name": unique_name,
        "defendant_last_name": "Test",
        "jail_facility": "Test Jail",
        "county": "Test County",
        "state_jurisdiction": "TX",
        "bond_amount": 5000,
        "bond_type": "SURETY",
        "charge_severity": "MISDEMEANOR",
        "caller_name": "Tester",
        "caller_relationship": "Self",
        "caller_phone": "555-0000",
        "intent_signal": "CHECKING_COST"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/cases/", json=case_data, timeout=30)
        resp.raise_for_status()
        case = resp.json()
        case_id = case['id']
        print(f"Case Created: {case_id}")
    except Exception as e:
        print(f"Error creating case: {e}")
        return

    print("Fetching Audit Logs...")
    try:
        # Give orchestrator a moment
        time.sleep(5)
        resp = requests.get(f"{BASE_URL}/audit/case/{case_id}", timeout=10)
        resp.raise_for_status()
        logs = resp.json()
        
        print(f"Found {len(logs)} logs:")
        for log in logs:
            print(f"- [{log['timestamp']}] {log['action']} by {log['performed_by']}")
            
        expected_actions = ["CASE_QUALIFIED", "RISK_ASSESSED"]
        passed = all(any(l['action'] == a for l in logs) for a in expected_actions)
        
        if passed:
            print("\nSUCCESS: Audit logs verified!")
        else:
            print("\nFAILURE: Missing expected logs.")
            
    except Exception as e:
        print(f"Error fetching logs: {e}")

if __name__ == "__main__":
    run_test()
