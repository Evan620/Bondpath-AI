from .base import BaseAgent
from pydantic import BaseModel, Field
from typing import List, Optional

# Define the output schema for the Intake Agent
class DefendantInfo(BaseModel):
    name: str
    dob: Optional[str] = None
    jail: Optional[str] = None
    charges: List[str] = []

class IndemnitorInfo(BaseModel):
    name: str
    relationship: str
    phone: Optional[str] = None
    income: Optional[float] = None

class IntakeOutput(BaseModel):
    defendant: DefendantInfo
    indemnitor: IndemnitorInfo
    bond_amount: float
    flags: List[str] = []
    confidence_score: float

class IntakeAgent(BaseAgent):
    def run(self, raw_input: dict) -> dict:
        """
        Extracts structured data from raw intake parsing.
        input_data: {'raw_text': '...'} or {'transcript': '...'}
        """
        prompt = """
        You are an expert Bail Intake Specialist. 
        Your goal is to extract structured information from the provided raw text or notes.
        
        Extract:
        - Defendant Name (normalize format)
        - Jail Location
        - Charges
        - Bond Amount (number only)
        - Indemnitor Name, Relationship, Phone, Income
        
        Flags to set:
        - "felony" if charges imply felony
        - "high_bond" if bond > 20000
        - "out_of_county" if jail is not local (assume local is 'Harris')
        
        Return JSON matching the schema.
        """
        
        return self._call_gemini(
            prompt=prompt,
            response_schema=IntakeOutput,
            context=raw_input
        )

intake_agent = IntakeAgent()
