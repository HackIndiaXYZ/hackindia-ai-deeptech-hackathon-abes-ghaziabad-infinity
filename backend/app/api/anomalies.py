"""
Anomalies API Route.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional

from app.models.schemas import AnomalyResult, SeverityLevel
from app.db.supabase_client import get_supabase
from app.core.security import verify_supabase_token


router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])


@router.get("", response_model=List[AnomalyResult])
async def get_anomalies(
    limit: int = Query(50, ge=1, le=500),
    severity: Optional[SeverityLevel] = None,
    user: dict = Depends(verify_supabase_token)
):
    """
    Retrieve recent anomalies for the authenticated user's tenant.
    """
    supabase = get_supabase()
    tenant_id = user.get("sub")
    
    if not tenant_id:
        raise HTTPException(status_code=401, detail="User ID missing from token")
    
    query = supabase.table("anomalies").select("*").eq("tenant_id", tenant_id).order("log_id", desc=True)
    
    if severity:
        query = query.eq("final_severity", severity.value)
        
    query = query.limit(limit)
    
    try:
        response = query.execute()
        results = response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    # If filtering by user_id, we would need to join the logs table.
    # Supabase supports embedded resource routing: table("anomalies").select("*, logs!inner(*)").eq("logs.user_id", user_id)
    # But for simplicity in this schema, if user_id is provided and we don't have a direct link in anomalies:
    # Actually, the anomalies table just has log_id. We'll skip deep filtering for the basic version,
    # or just return the data. If user needs deep filtering, they should use GraphQL or Supabase Views.
        
    return results
