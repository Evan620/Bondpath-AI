from .base import BaseAgent
from pydantic import BaseModel
from typing import List, Optional, Any
import requests
from io import BytesIO
import filetype
import json
import base64

# Output Schema
class DocVerificationOutput(BaseModel):
    is_valid_document: bool
    document_type_detected: str
    extracted_data: dict  # Key-value pairs of extracted text
    match_status: str     # "MATCH", "MISMATCH", "UNCLEAR"
    mismatches: List[str] = []
    confidence_score: int

class DocVerifyAgent(BaseAgent):
    def run(self, input_data: dict) -> dict:
        """
        Verifies a document against case data using OpenAI Vision.
        Input: { "image_url": "...", "case_data": {...}, "doc_type": "booking_sheet" }
        """
        file_url = input_data.get('image_url') or input_data.get('file_url')
        case_data = input_data.get('case_data', {})
        doc_type = input_data.get('doc_type', 'unknown')
        
        if not file_url:
            return {"error": "No file URL provided"}
            
        file_data = None
        mime_type = "application/octet-stream"

        # 1. Fetch File
        try:
            if file_url.startswith('http'):
                 response = requests.get(file_url)
                 response.raise_for_status()
                 file_data = response.content
            else:
                with open(file_url, 'rb') as f:
                    file_data = f.read()

            kind = filetype.guess(file_data)
            mime_type = kind.mime if kind else 'application/octet-stream'

        except Exception as e:
            return {
                "is_valid_document": False, "document_type_detected": "error", "extracted_data": {},
                "match_status": "ERROR", "mismatches": [f"Could not load file: {str(e)}"], "confidence_score": 0
            }

        # 2. Prepare for OpenAI
        base64_image = base64.b64encode(file_data).decode('utf-8')
        
        prompt = f"""
        You are an expert Document Verifier for Bail Bonds.
        Analyze this {doc_type} and compare it against the Case Data.

        Case Data: {json.dumps(case_data, default=str)}
        
        Task:
        1. Identify the document type.
        2. Extract key fields (Booking #, Name, DOB, Charges, Amounts).
        3. Compare against Case Data.
        4. Report Mismatches.

        Output matching the JSON schema provided.
        """
        
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        }
                    }
                ]
            }
        ]
        
        try:
            result = self._call_openai(
                messages=messages,
                response_format=DocVerificationOutput
            )
            return result
            
        except Exception as e:
            print(f"Doc Verify Agent Failed: {e}")
            return {
                "is_valid_document": False,
                "document_type_detected": "error", "extracted_data": {},
                "match_status": "ERROR",
                "mismatches": [f"AI Processing Error: {str(e)}"],
                "confidence_score": 0
            }

# Use OpenAI for this agent
doc_verify_agent = DocVerifyAgent(model_name="gpt-4o", provider="openai")
