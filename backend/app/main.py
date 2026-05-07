from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.core.config import get_settings
from app.core.rate_limiter import setup_rate_limiter
from app.api import logs, anomalies, keys, dashboard, reports, notifications, live_logs, ml, integrations
from app.ml.ensemble import get_ensemble

load_dotenv()
settings = get_settings()

app = FastAPI(title=settings.app_name, version="1.0.0", debug=settings.debug)

# Setup Rate Limiter
setup_rate_limiter(app)

# Configure CORS
origins = [
    settings.frontend_url,
    "http://localhost:5173",
    "http://localhost:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(logs.router)
app.include_router(anomalies.router)
app.include_router(keys.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(live_logs.router)
app.include_router(ml.router)
app.include_router(integrations.router)

from app.tasks.scheduler import start_scheduler, stop_scheduler

@app.on_event("startup")
async def startup_event():
    """Load the hybrid ML ensemble and start the retraining scheduler."""
    print("Loading ML Ensemble (Isolation Forest + XGBoost)...")
    _ = get_ensemble()
    print("ML Ensemble loaded successfully.")
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up background tasks."""
    stop_scheduler()

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.app_name} API"}
