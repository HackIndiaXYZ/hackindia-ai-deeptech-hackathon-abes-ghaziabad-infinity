"""
ML Administration Endpoints.
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from app.ml.retrainer import retrain, get_training_history
from app.ml.ensemble import get_ensemble

router = APIRouter(prefix="/api/ml", tags=["ML"])
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

def verify_admin_key(api_key: str = Security(api_key_header)):
    """Verify master/dev key for ML admin actions."""
    from app.core.config import get_settings
    settings = get_settings()
    if api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Not authorized for ML admin actions")
    return True

@router.post("/retrain-now", status_code=202)
def trigger_manual_retraining(
    background_tasks: BackgroundTasks,
    hours: int = 24,
    authorized: bool = Depends(verify_admin_key)
):
    """
    Manually trigger ensemble retraining in the background.
    Only accessible with the master dev API_KEY.
    """
    background_tasks.add_task(retrain, hours=hours, reason="manual_api_trigger")
    return {"message": "Ensemble retraining job started in the background."}


@router.get("/status")
def get_ml_status(authorized: bool = Depends(verify_admin_key)):
    """
    Returns current ensemble status including:
    - Model weights (IF vs XGBoost)
    - Per-model metadata (training time, sample count, metrics)
    - Feature importance from XGBoost
    """
    ensemble = get_ensemble()
    return ensemble.get_status()


@router.get("/training-history")
def get_ml_training_history(authorized: bool = Depends(verify_admin_key)):
    """
    Returns training history with metrics over time.
    Useful for monitoring model health and retraining frequency.
    """
    history = get_training_history()
    return {"history": history, "total_retrains": len(history)}
