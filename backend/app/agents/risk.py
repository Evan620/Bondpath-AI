from .base import BaseAgent
from pydantic import BaseModel

class RiskAssessmentSchema(BaseModel):
    risk_score: int
    risk_tier: str
    risk_factors: list[str]
    mitigating_factors: list[str]
    recommendation: str

class RiskAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        
    def run(self, facts: dict) -> dict:
        prompt = """
        You are an expert Bail Risk Assessment AI for a bail bond company.
        Analyze the following case facts to determine the flight risk and financial reliability of the defendant and indemnitor.
        
        COMPREHENSIVE EVALUATION CRITERIA:
        
        1. DEFENDANT RISK FACTORS:
           - Geographic Stability: In-state vs out-of-state residence, local ties to community
           - Charge Severity: Felony vs misdemeanor, violent vs non-violent
           - Bond Amount: Higher amounts (>$50k) increase flight risk
           - Prior History: Any mention of prior failures to appear or criminal history
           - Employment: Stable employment reduces flight risk
        
        2. INDEMNITOR STRENGTH (Critical Factor):
           - Presence: Does an indemnitor exist? (No indemnitor = major risk)
           - Financial Stability: Employment status, income indicators
           - Relationship: Spouse/parent (stronger) vs friend/acquaintance (weaker)
           - Local Ties: Same county/state as defendant
           - Collateral: Property ownership, assets mentioned
        
        3. FINANCIAL RISK:
           - Payment Structure: Full premium (lower risk) vs payment plan (higher risk)
           - Down Payment: Adequate down payment shows commitment
           - Payment Method: Verified payment capability
           - Collateral Documentation: Property deeds, vehicle titles
        
        4. DOCUMENTATION COMPLETENESS:
           - ID Verification: Defendant and indemnitor IDs uploaded
           - Booking Sheet: Official jail documentation
           - Financial Docs: Payment receipts, collateral documentation
           - Missing documents increase risk
        
        SCORING RULES:
        - High Risk (76-100): Out of state defendant, no indemnitor OR weak indemnitor, high bond (>$50k), 
          felony charges, unemployment, missing critical documents, payment plan without adequate down payment
        - Medium Risk (40-75): Stable indemnitor but serious charges, OR local defendant with weak financial backing,
          some documentation gaps, payment plan with adequate down payment
        - Low Risk (0-39): Local resident, stable employment, strong indemnitor (employed family member), 
          minor charges, full premium OR substantial down payment, complete documentation
        
        OUTPUT REQUIREMENTS:
        - risk_score: 0-100 integer (be precise, use the full range)
        - risk_tier: "Low Risk", "Medium Risk", or "High Risk"
        - risk_factors: List of 2-5 specific concerns found in this case
        - mitigating_factors: List of 2-5 positive factors that reduce risk
        - recommendation: ONE clear, actionable sentence for the underwriter. Examples:
          * "Approve with standard weekly check-ins and GPS monitoring"
          * "Approve but require additional collateral or co-signer"
          * "Hold pending verification of indemnitor employment"
          * "Deny due to high flight risk - out of state defendant with no local ties"
          * "Approve with full premium payment required upfront"
        
        Be specific and reference actual case details in your risk_factors, mitigating_factors, and recommendation.
        """
        
        return self._call_gemini(prompt, RiskAssessmentSchema, context=facts)

risk_agent = RiskAgent()
