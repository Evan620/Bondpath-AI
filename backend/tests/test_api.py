from unittest.mock import patch
from app.schemas.case import CaseCreate

def test_create_case_success(client):
    """Test creating a case successfully."""
    # Mock the LangGraph invoke so we don't actually run the agents/LLMs
    with patch("app.api.cases.orchestrator_app.invoke") as mock_invoke:
        mock_invoke.return_value = {
            "case_id": "mock_id",
            "current_state": "QUALIFIED",
            "rule_results": {"generated": "true"},
            "agent_outputs": {"risk": "low"},
            "history": []
        }
        
        payload = {
            "defendant_first_name": "Test",
            "defendant_last_name": "User",
            "jail_facility": "Test Jail",
            "county": "Test County",
            "state_jurisdiction": "TX",
            "bond_amount": 10000,
            "bond_type": "SURETY",
            "charge_severity": "MISDEMEANOR",
            "caller_name": "Test Caller",
            "caller_relationship": "Self",
            "caller_phone": "555-5555",
            "intent_signal": "GET_OUT_TODAY"
        }
        
        response = client.post("/cases/", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["defendant_first_name"] == "Test"
        assert data["id"] is not None
        assert data["state"] == "QUALIFIED" # Should match mock return
        
        # Verify orchestrator was called
        mock_invoke.assert_called_once()


def test_get_audit_logs(client):
    """Test retrieving audit logs for a case."""
    # First create a case
    with patch("app.api.cases.orchestrator_app.invoke") as mock_invoke:
        mock_invoke.return_value = {
            "case_id": "mock",
            "current_state": "INTAKE",
            "rule_results": {}, 
            "agent_outputs": {},
            "history": []
        }
        payload = {
            "defendant_first_name": "Audit",
            "defendant_last_name": "Test",
            "jail_facility": "Jail",
            "county": "County",
            "state_jurisdiction": "TX",
            "bond_amount": 5000,
            "bond_type": "SURETY",
            "charge_severity": "MISDEMEANOR",
            "caller_name": "Caller",
            "caller_relationship": "Friend",
            "caller_phone": "123",
            "intent_signal": "UNSURE"
        }
        create_resp = client.post("/cases/", json=payload)
        case_id = create_resp.json()["id"]
        
    # Initially logs might be empty if orchestrator didn't run (since we mocked it)
    # But let's verify the endpoint works (returns 200 and a list)
    response = client.get(f"/audit/case/{case_id}")
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
