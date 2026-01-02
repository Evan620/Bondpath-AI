from unittest.mock import MagicMock
from app.services.decision_service import decision_service
from app.models.case import Case
from app.rules.engine import rule_engine, RuleResult
from app.rules.bail_rules import QualificationRule

def test_decision_record():
    mock_db = MagicMock()
    
    # Mock record_decision
    decision = decision_service.record_decision(
        db=mock_db,
        case_id="12345",
        decision_type="APPROVAL",
        rationale="Looks good",
        made_by="user-1"
    )
    
    assert decision.decision_type == "APPROVAL"
    assert decision.rationale == "Looks good"
    mock_db.add.assert_called()
    mock_db.commit.assert_called()

def test_evaluate_and_record():
    # Setup
    mock_db = MagicMock()
    mock_case = Case(
        id="case-1",
        bond_amount=10000,
        facts={"bond_amount": 10000, "defendant": {"jail": "Harris"}}
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_case
    
    # We need to spy on rule_engine or trust it works (we tested it separately)
    # Let's just run it
    
    try:
        decision_service.evaluate_and_record(
            db=mock_db,
            case_id="case-1",
            rule_name="qualification_check"
        )
    except Exception as e:
        assert False, f"Service raised exception: {e}"

if __name__ == "__main__":
    test_decision_record()
    test_evaluate_and_record()
    print("Decision Service tests passed!")
