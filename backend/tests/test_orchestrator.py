import unittest
from unittest.mock import MagicMock, patch
from app.orchestrator.graph import app
from app.orchestrator.state import CaseState

class TestOrchestrator(unittest.TestCase):
    @patch('app.orchestrator.nodes.intake_agent')
    def test_intake_flow_success(self, mock_intake_agent):
        # Mock agent output
        mock_intake_agent.run.return_value = {
            "defendant": {"name": "John", "jail": "Harris County Jail"},
            "bond_amount": 10000.0,
            "charge": {"type": "misdemeanor"}
        }

        # Initial State
        initial_state = CaseState(
            case_id="123",
            current_state="INTAKE",
            facts={"raw_input": {"notes": "some notes"}},
            derived_facts={},
            blockers=[],
            next_actions=[],
            agent_outputs={},
            rule_results={},
            history=[]
        )

        # Run Graph
        final_state = app.invoke(initial_state)

        # Assertions
        self.assertEqual(final_state['current_state'], "QUALIFIED")
        self.assertIn("Transition: INTAKE -> QUALIFIED", final_state['history'])
        self.assertEqual(final_state['facts']['bond_amount'], 10000.0)

    @patch('app.orchestrator.nodes.intake_agent')
    def test_intake_flow_blocked(self, mock_intake_agent):
        # Mock agent output with invalid bond
        mock_intake_agent.run.return_value = {
            "defendant": {"name": "John", "jail": "Harris County Jail"},
            "bond_amount": 0.0, # ZERO bond should fail qualification
            "charge": {"type": "misdemeanor"}
        }

        initial_state = CaseState(
            case_id="123",
            current_state="INTAKE",
            facts={"raw_input": {"notes": "bad bond"}},
            derived_facts={},
            blockers=[],
            next_actions=[],
            agent_outputs={},
            rule_results={},
            history=[]
        )

        final_state = app.invoke(initial_state)

        self.assertEqual(final_state['current_state'], "INTAKE") # Should not move
        self.assertIn("Blocked at INTAKE", final_state['history'])
        self.assertTrue(len(final_state['blockers']) > 0)

if __name__ == "__main__":
    unittest.main()
