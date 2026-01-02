from .base import BaseAgent
from pydantic import BaseModel
from typing import List, Optional
from ..rules.engine import rule_engine

# Output Schema
class ReadinessOutput(BaseModel):
    ready_for_submission: bool
    confidence_score: int
    blockers: List[str] = []
    warnings: List[str] = []
    missing_fields: List[str] = []
    quality_notes: Optional[str] = None

class ReadinessAgent(BaseAgent):
    def __init__(self):
        super().__init__(model_name="gpt-4o", provider="openai")

    def run(self, case_data: dict) -> dict:
        """
        Analyzes a case for readiness to submit to underwriting.
        Combines deterministic RuleEngine checks with LLM-based quality analysis.
        """
        
        # 1. Run Deterministic Rules (Hard Checks)
        # We simulate a "submission" check using the rule engine if rules exist
        # For now, we'll manually check key fields as "hard blockers"
        hard_blockers = []
        
        required_fields = [
            'defendant_first_name', 'defendant_last_name', 
            'bond_amount', 'jail_facility', 'charges'
        ]
        
        missing = [field for field in required_fields if not case_data.get(field)]
        if missing:
            hard_blockers.append(f"Missing basic info: {', '.join(missing)}")
            
        if case_data.get('bond_amount', 0) <= 0:
            hard_blockers.append("Bond amount must be greater than 0")

        # 2. LLM Analysis (Soft Checks / Quality)
        system_prompt = """You are an expert Bail Underwriter Assistant. 
Review the following case data and identify any quality issues or specific risks that might cause an underwriter to reject it.

Look for:
- Vague collateral descriptions (e.g. "jewelry" instead of "Rolex Watch, Model X")
- Missing or weak indemnitor details (e.g. no employer listed)
- Inconsistent data (e.g. bond amount doesn't match typical charge severity if evident)

Task:
- Determine if this case looks ready for a professional underwriter to review.
- Assign a confidence_score (0-100).
- List specific warnings about data quality.
- Provide brief quality_notes.
"""
        
        user_prompt = f"""
Data:
{case_data}

Hard Blockers found by system: {hard_blockers}
"""
        
        try:
            llm_result = self._call_openai(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format=ReadinessOutput
            )
            
            # Merge hard blockers if LLM missed them or just to be safe
            # (Though LLM should include them if instructed, we force them here)
            if hard_blockers:
                llm_result['blockers'] = list(set(llm_result.get('blockers', []) + hard_blockers))
                llm_result['ready_for_submission'] = False
                llm_result['confidence_score'] = min(llm_result['confidence_score'], 40)
                
            return llm_result
            
        except Exception as e:
            print(f"Readiness Agent Failed: {e}")
            # Fallback for error
            return {
                "ready_for_submission": False,
                "confidence_score": 0,
                "blockers": ["AI Service Unavailable - Please check manually"],
                "warnings": [],
                "missing_fields": missing,
                "quality_notes": "Could not perform AI analysis."
            }

readiness_agent = ReadinessAgent()
