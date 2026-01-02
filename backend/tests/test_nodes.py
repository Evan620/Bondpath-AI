from unittest.mock import MagicMock, patch
from app.orchestrator.nodes import intake_node, decision_node, dedup_node, risk_node
from app.orchestrator.state import CaseState

# Helper to create initial state
def create_state(case_id="test_id") -> CaseState:
    return CaseState(
        case_id=case_id,
        current_state="INTAKE",
        facts={"raw_input": "some raw text"},
        derived_facts={},
        blockers=[],
        next_actions=[],
        agent_outputs={},
        rule_results={},
        history=[]
    )

def test_intake_node_success():
    """Test intake node calls agent and updates state."""
    state = create_state()
    
    mock_output = {"defendant_name": "John Doe", "bond_amount": 5000}
    
    with patch("app.orchestrator.nodes.intake_agent.run", return_value=mock_output) as mock_run:
        new_state = intake_node(state)
        
        assert new_state['agent_outputs']['intake'] == mock_output
        assert new_state['facts']['defendant_name'] == "John Doe"
        mock_run.assert_called_once()

def test_decision_node_qualifies():
    """Test decision node moves to QUALIFIED if rules pass."""
    state = create_state()
    # Setup facts that will pass qualification
    state['facts'] = {
        "state_jurisdiction": "TX",
        "bond_amount": 10000, 
        "bond_type": "SURETY",
        "charge_severity": "MISDEMEANOR"
    }
    
    new_state = decision_node(state)
    
    assert new_state['current_state'] == 'QUALIFIED'
    assert new_state['rule_results']['qualification']['passed'] is True

def test_decision_node_fails():
    """Test decision node detects blockers."""
    state = create_state()
    # Setup facts that will fail (Out of State)
    state['facts'] = {
        "state_jurisdiction": "AK",
        "bond_amount": 10000
    }
    
    new_state = decision_node(state)
    
    # Logic in nodes.py says: if fail, stay in INTAKE (for now) but add blockers
    assert new_state['current_state'] == 'INTAKE' 
    assert len(new_state['blockers']) > 0
    assert "Jurisdiction 'AK' " in new_state['blockers'][0]

def test_risk_node_runs():
    """Test risk node calls agent."""
    state = create_state()
    state['facts'] = {"some":"data"}
    
    with patch("app.orchestrator.nodes.risk_agent.run", return_value={"risk_score": 10}) as mock_run:
        new_state = risk_node(state)
        assert new_state['agent_outputs']['risk']['risk_score'] == 10
        mock_run.assert_called_once()
