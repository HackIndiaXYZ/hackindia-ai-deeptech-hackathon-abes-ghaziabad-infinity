"""
Log Ingestion API Route.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Security
from fastapi.security import APIKeyHeader
from typing import Dict
import uuid

from app.models.schemas import LogEntry, LogResponse
from app.db.supabase_client import get_supabase
from app.pipeline.orchestrator import process_log_pipeline
from app.core.config import get_settings


router = APIRouter(prefix="/api/logs", tags=["Logs"])
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)


def verify_api_key(api_key: str = Security(api_key_header)):
    """Validate customer API key against the database and return the tenant_id."""
    supabase = get_supabase()
    
    # Dev Simulator Bypass
    if api_key == "sentivoy-dev-api-key-change-me":
        # Get the first active user to map the simulation logs to
        try:
            users_res = supabase.auth.admin.list_users()
            if users_res:
                return users_res[0].id
        except Exception as e:
            pass
            
    try:
        response = supabase.table("api_keys").select("tenant_id, is_active").eq("key_string", api_key).execute()
        if not response.data:
            raise HTTPException(status_code=403, detail="Invalid API Key")
            
        key_record = response.data[0]
        if not key_record.get("is_active"):
            raise HTTPException(status_code=403, detail="API Key has been revoked")
            
        return key_record.get("tenant_id")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error validating API key")


@router.post("", response_model=LogResponse, status_code=202)
async def ingest_log(
    log: LogEntry, 
    background_tasks: BackgroundTasks,
    tenant_id: str = Depends(verify_api_key)
):
    """
    Ingest a new log entry.
    Stores the raw log immediately and kicks off ML pipeline in the background.
    """
    supabase = get_supabase()
    
    # Inject tenant ID into the log payload
    log.tenant_id = tenant_id
    
    # We create an ID here so we can pass it to the pipeline
    log_id = str(uuid.uuid4())
    log_data = log.model_dump()
    log_data["id"] = log_id
    # Format datetime for Supabase
    log_data["timestamp"] = log.timestamp.isoformat()
    
    # Remove fields not present in the Supabase 'logs' table
    log_data.pop("user_role", None)
    log_data.pop("metadata", None)
    
    # Store raw log (synchronous in this setup, could be async)
    try:
        supabase.table("logs").insert(log_data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    # Trigger background pipeline
    background_tasks.add_task(process_log_pipeline, log, log_id)
    
    return LogResponse(id=log_id)
