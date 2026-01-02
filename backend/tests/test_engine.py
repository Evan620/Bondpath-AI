from app.rules.engine import rule_engine
from app.rules import bail_rules # Registers rules
from app.models.case import Case

def test_qualification_rule_success():
    """Test a perfect case facts dictionary against the rule."""
    facts = {
        "state_jurisdiction": "TX",
        "bond_amount": 10000,
        "bond_type": "SURETY",
        "charge_severity": "MISDEMEANOR"
    }
    result = rule_engine.evaluate_rule('qualification_check', facts)
    assert result.passed is True
    assert len(result.blockers) == 0

def test_qualification_rule_fail_state():
    """Test out of state."""
    facts = {
        "state_jurisdiction": "AK",
        "bond_amount": 10000,
        "bond_type": "SURETY",
        "charge_severity": "MISDEMEANOR"
    }
    result = rule_engine.evaluate_rule('qualification_check', facts)
    assert result.passed is False
    assert "Jurisdiction 'AK' not supported" in result.blockers

def test_qualification_rule_fail_amount():
    """Test bond too high."""
    facts = {
        "state_jurisdiction": "TX",
        "bond_amount": 1000000,
        "bond_type": "SURETY",
        "charge_severity": "FELONY"
    }
    result = rule_engine.evaluate_rule('qualification_check', facts)
    assert result.passed is False
    assert "Bond amount $1000000.0 exceeds limit" in result.blockers
