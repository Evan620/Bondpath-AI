import unittest
from unittest.mock import MagicMock, patch
from app.agents.intake import intake_agent, IntakeOutput
import json

class TestIntakeAgent(unittest.TestCase):
    @patch('google.generativeai.GenerativeModel')
    def test_run(self, MockModel):
        # Setup mock response
        mock_instance = MockModel.return_value
        
        expected_json = {
            "defendant": {
                "name": "John Doe",
                "jail": "Harris County",
                "charges": ["Theft"]
            },
            "indemnitor": {
                "name": "Jane Doe",
                "relationship": "Mother"
            },
            "bond_amount": 10000.0,
            "flags": ["high_bond"],
            "confidence_score": 0.95
        }
        
        mock_response = MagicMock()
        mock_response.text = json.dumps(expected_json)
        mock_instance.generate_content.return_value = mock_response
        
        # Inject mock model into agent (since it's already initialized)
        intake_agent.model = mock_instance

        # Run agent
        input_data = {"raw_notes": "John Doe, theft charge, 10k bond, mom Jane signing."}
        result = intake_agent.run(input_data)
        
        self.assertEqual(result['defendant']['name'], "John Doe")
        self.assertEqual(result['bond_amount'], 10000.0)
        self.assertIn("high_bond", result['flags'])

if __name__ == "__main__":
    unittest.main()
