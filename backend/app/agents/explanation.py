from .base import BaseAgent
import json

class ExplanationAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        
    def run(self, context: dict) -> dict:
        # Context includes: case state, rule results, risk score, etc.
        prompt = f"""
        You are a Bail Decision Explainer.
        Summarize the automated decision for this bail bond case for a human agent (CST).
        
        Case Context:
        {json.dumps(context, indent=2)}
        
        Output Schema (JSON only):
        {{
            "summary": "<1 sentence summary of the status>",
            "detailed_reasoning": "<3-4 sentences explaining WHY the decision was made, referencing specific facts and rules>",
            "recommended_action": "<Specific next step for the human agent>"
        }}
        
        Guidelines:
        - Be professional and objective.
        - Start with the outcome (Qualified, Denied, Needs Review).
        - Explicitly mention if the Risk Score played a role.
        - If 'blockers' exist, list them clearly.
        """
        
        raw_output = self._call_gemini(prompt)
        return self._parse_output(raw_output)

explanation_agent = ExplanationAgent()
