from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str

class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None

class UserLogin(BaseModel):
    email: str
    password: str
