from .base import BaseAgent
import typing_extensions as typing

class RiskAssessmentSchema(typing.TypedDict):
    risk_score: int
    risk_tier: str
    risk_factors: list[str]
    mitigating_factors: list[str]

class RiskAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        
    def run(self, facts: dict) -> dict:
        prompt = """
        You are an expert Bail Risk Assessment AI.
        Analyze the following case facts to determine the flight risk and financial reliability of the defendant and indemnitor.
        
        Rules for Scoring:
        - High Risk (>75): Out of state/county, unemployment, high bond amount (>$50k), felony charges, no indemnitor.
        - Medium Risk (40-75): Stable indemnitor but serious charge, or low bond but weak ties to community.
        - Low Risk (<40): Local resident, stable job, strong indemnitor, minor charge.
        """
        
        return self._call_gemini(prompt, RiskAssessmentSchema, context=facts)

risk_agent = RiskAgent()
