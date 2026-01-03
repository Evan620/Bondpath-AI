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
        
        # Always try to initialize both if possible, to allow for fallbacks
        try:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(model_name)
        except Exception as e:
            print(f"Warning: Failed to initialize Gemini: {e}")

        try:
            self.client = OpenAI(api_key=settings.openai_api_key or os.environ.get("OPENAI_API_KEY"))
        except Exception:
            self.client = None
    
    def _call_gemini(self, prompt: str, response_schema: type, context: dict = None) -> dict:
        """
        Calls Gemini with a prompt and forces structured JSON output matching response_schema.
        Falls back to OpenAI if Gemini hits rate limits (429).
        """
        for attempt in range(3):
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
                import time
                import random
                
                # Check for rate limit errors
                if "429" in str(e) or "quota" in str(e).lower():
                    if attempt < 2:  # Don't sleep on the last attempt
                        sleep_time = (2 ** attempt) + (random.random() * 2)
                        print(f"Gemini 429 (Quota Exceeded). Retrying in {sleep_time:.2f}s...")
                        time.sleep(sleep_time)
                        continue
                    else:
                        # Fallback to OpenAI if retries exhausted and client exists
                        if self.client:
                            print("Gemini Quota Exceeded. Falling back to OpenAI...")
                            return self._call_openai(
                                [{"role": "user", "content": full_prompt}],
                                response_format=response_schema
                            )
                
                print(f"Gemini API Error: {e}")
                raise e

    def _call_openai(self, messages: list, response_format: type = None) -> dict:
        """
        Calls OpenAI with messages and optional structured output.
        """
        try:
             # Use gpt-4o for fallback if original model was a Gemini model
            model = "gpt-4o" if "gemini" in self.model_name else self.model_name

            if response_format:
                completion = self.client.beta.chat.completions.parse(
                    model=model,
                    messages=messages,
                    response_format=response_format,
                )
                return completion.choices[0].message.parsed.model_dump()
            else:
                 completion = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    response_format={"type": "json_object"}
                )
                 return json.loads(completion.choices[0].message.content)

        except Exception as e:
            print(f"OpenAI API Error: {e}")
            raise e

    def run(self, input_data: dict) -> dict:
        raise NotImplementedError
