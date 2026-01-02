from app.rules.engine import rule_engine
from app.rules.bail_rules import QualificationRule, FinancialFeasibilityRule

def test_qualification_rule():
    # Pass case
    facts_pass = {
        "bond_amount": 10000,
        "defendant": {"jail": "Harris County Jail"}
    }
    result = rule_engine.evaluate_rule("qualification_check", facts_pass)
    assert result.passed == True
    assert len(result.blockers) == 0

    # Fail case - Zero bond
    facts_fail_bond = {
        "bond_amount": 0,
        "defendant": {"jail": "Harris County Jail"}
    }
    result_fail = rule_engine.evaluate_rule("qualification_check", facts_fail_bond)
    assert result_fail.passed == False
    assert "Bond amount must be greater than 0" in result_fail.blockers

def test_financial_feasibility_rule():
    # Pass case
    facts_pass = {
        "bond_amount": 10000,
        "financial": {
            "down_payment": 500, # 5%
            "monthly_payment": 100
        },
        "indemnitor": {
            "income": 2000
        }
    }
    result = rule_engine.evaluate_rule("financial_feasibility", facts_pass)
    assert result.passed == True

    # Fail case - Low down payment
    facts_fail_dp = {
        "bond_amount": 10000,
        "financial": {
            "down_payment": 200, # 2% < 5%
            "monthly_payment": 100
        },
        "indemnitor": {
            "income": 2000
        }
    }
    result_fail = rule_engine.evaluate_rule("financial_feasibility", facts_fail_dp)
    assert result_fail.passed == False
    assert any("below minimum requirement" in b for b in result_fail.blockers)

if __name__ == "__main__":
    test_qualification_rule()
    test_financial_feasibility_rule()
    print("All tests passed!")
