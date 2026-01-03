from .base import BaseAgent
from pydantic import BaseModel
import json

class ChatResponse(BaseModel):
    response: str
    suggested_actions: list[str]

class ChatAgent(BaseAgent):
    def run(self, query: str, context: dict = None, role: str = "USER") -> dict:
        prompt = f"""
        You are the Bondpath Copilot, an AI assistant for a bail bond management platform.
        Your role is to assist {role}s in making decisions, understanding case details, and navigating compliance rules.

        CURRENT CONTEXT:
        {json.dumps(context, default=str) if context else "No specific case selected."}

        USER QUERY:
        {query}

        GUIDELINES:
        1. Be helpful, concise, and professional.
        2. Use the provided context to answer specific questions about the case (e.g., risk scores, missing documents).
        3. If the user asks for policy info and you don't have it in the context, refer to general best practices but disclaimer that you don't have specific agency policy docs loaded yet.
        4. Do NOT hallucinate facts not present in the context.
        5. Suggest next steps if applicable.

        OUTPUT FORMAT:
        Return a JSON object with:
        - "response": The text answer to the user.
        - "suggested_actions": A list of short strings for buttons (e.g., "View Risk Details", "Draft Email").
        """
        
        return self._call_gemini(prompt, ChatResponse)

chat_agent = ChatAgent()
