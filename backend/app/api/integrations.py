"""
Integrations API Route.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any, Optional
import uuid
from pydantic import BaseModel, Field
from datetime import datetime

from app.db.supabase_client import get_supabase
from app.api.logs import verify_api_key

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])

class IntegrationCreate(BaseModel):
    provider: str = Field(..., description="E.g., 'slack', 'github', 'jira'")
    config: Dict[str, Any] = Field(..., description="Configuration payload (e.g., webhook URL, API token)")

class IntegrationResponse(BaseModel):
    id: str
    tenant_id: str
    provider: str
    config: Dict[str, Any]
    is_active: bool
    created_at: str

@router.get("", response_model=List[IntegrationResponse])
def get_integrations(tenant_id: str = Depends(verify_api_key)):
    """Retrieve all active integrations for the tenant."""
    supabase = get_supabase()
    try:
        response = supabase.table("integrations").select("*").eq("tenant_id", tenant_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("", response_model=IntegrationResponse)
def create_integration(integration: IntegrationCreate, tenant_id: str = Depends(verify_api_key)):
    """Create or update an integration."""
    supabase = get_supabase()
    
    # Check if provider already exists for tenant
    try:
        existing = supabase.table("integrations").select("id").eq("tenant_id", tenant_id).eq("provider", integration.provider).execute()
        if existing.data:
            # Update existing
            int_id = existing.data[0]["id"]
            updated = supabase.table("integrations").update({
                "config": integration.config,
                "is_active": True
            }).eq("id", int_id).execute()
            return updated.data[0]
            
        # Create new
        payload = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "provider": integration.provider,
            "config": integration.config,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        res = supabase.table("integrations").insert(payload).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving integration: {str(e)}")

@router.delete("/{integration_id}")
def delete_integration(integration_id: str, tenant_id: str = Depends(verify_api_key)):
    """Deactivate an integration."""
    supabase = get_supabase()
    try:
        # We can either delete or soft-delete (set is_active = False)
        # We'll do a hard delete for security of tokens
        res = supabase.table("integrations").delete().eq("id", integration_id).eq("tenant_id", tenant_id).execute()
        return {"status": "success", "message": "Integration disconnected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting integration: {str(e)}")
