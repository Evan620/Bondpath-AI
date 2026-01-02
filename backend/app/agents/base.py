import google.generativeai as genai
from ..config import settings
import json
import typing_extensions as typing
from openai import OpenAI
import os

class BaseAgent:
    def __init__(self, model_name="gemini-2.0-flash", provider="gemini"):
        self.provider = provider
        self.model_name = model_name
        
        if provider == "gemini":
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(model_name)
        elif provider == "openai":
            self.client = OpenAI(api_key=settings.openai_api_key or os.environ.get("OPENAI_API_KEY"))
    
    def _call_gemini(self, prompt: str, response_schema: type, context: dict = None) -> dict:
        """
        Calls Gemini with a prompt and forces structured JSON output matching response_schema.
        """
        try:
           
            full_prompt = f"{prompt}\n\nContext: {json.dumps(context, default=str) if context else '{}'}"
            
            result = self.model.generate_content(
                full_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema
                )
            )
            return json.loads(result.text)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            raise e

    def _call_openai(self, messages: list, response_format: type = None) -> dict:
        """
        Calls OpenAI with messages and optional structured output.
        """
        try:
            if response_format:
                completion = self.client.beta.chat.completions.parse(
                    model=self.model_name,
                    messages=messages,
                    response_format=response_format,
                )
                return completion.choices[0].message.parsed.model_dump()
            else:
                 completion = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    response_format={"type": "json_object"}
                )
                 return json.loads(completion.choices[0].message.content)

        except Exception as e:
            print(f"OpenAI API Error: {e}")
            raise e

    def run(self, input_data: dict) -> dict:
        raise NotImplementedError
