from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import init_db, is_db_empty
from seed import seed_database
from routes import query, metrics, anomalies, digest

# Load environment variables from .env file
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Pulse Analytics Copilot",
    description="AI-powered analytics assistant for SaaS metrics",
    version="1.0.0",
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(query.router)
app.include_router(metrics.router)
app.include_router(anomalies.router)
app.include_router(digest.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database and seed with demo data on startup."""
    print("Initializing database...")
    init_db()

    if is_db_empty():
        print("Database is empty, seeding with demo data...")
        seed_database()
        print("Demo data loaded successfully!")
    else:
        print("Database already has data, skipping seed.")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Pulse Analytics Copilot",
        "mode": "live" if os.getenv("ANTHROPIC_API_KEY") else "demo",
    }


@app.get("/")
async def root():
    """Root endpoint with API documentation."""
    return {
        "message": "Pulse Analytics Copilot API",
        "docs": "/docs",
        "mode": "live" if os.getenv("ANTHROPIC_API_KEY") else "demo (no API key set)",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
