from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api import auth, cases, audit, users, signature, agents, chat

app = FastAPI(
    title="Bail Decision System",
    description="Control plane for orchestrating bail decisions",
    version="0.1.0"
)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Create tables on startup (for development)
from .database import engine, Base
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(audit.router)
app.include_router(users.router)
app.include_router(signature.router)
app.include_router(agents.router)
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "0.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
