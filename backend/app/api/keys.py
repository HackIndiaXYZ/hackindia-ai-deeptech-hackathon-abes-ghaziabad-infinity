"""
API Keys management route.
Allows customers to generate and revoke API keys for integrating their platform.
"""

from fastapi import APIRouter, Depends, HTTPException
import secrets
import string
import uuid
from typing import List
from datetime import datetime

from app.models.schemas import ApiKeyCreate, ApiKeyResponse
from app.db.supabase_client import get_supabase
from app.core.security import verify_supabase_token


router = APIRouter(prefix="/api/keys", tags=["API Keys"])


def generate_secure_key() -> str:
    """Generate a secure, random API key."""
    alphabet = string.ascii_letters + string.digits
    random_str = ''.join(secrets.choice(alphabet) for i in range(32))
    return f"sv_live_{random_str}"


@router.post("", response_model=ApiKeyResponse, status_code=201)
async def create_api_key(
    payload: ApiKeyCreate,
    user: dict = Depends(verify_supabase_token)
):
    """
    Generate a new API key for the authenticated user.
    """
    supabase = get_supabase()
    tenant_id = user.get("sub")
    if not tenant_id:
        raise HTTPException(status_code=401, detail="User ID missing from token")
        
    key_string = generate_secure_key()
    
    key_data = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "key_string": key_string,
        "name": payload.name,
        "created_at": datetime.utcnow().isoformat(),
        "is_active": True
    }
    
    try:
        response = supabase.table("api_keys").insert(key_data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create API key: {str(e)}")


@router.get("", response_model=List[ApiKeyResponse])
async def list_api_keys(
    user: dict = Depends(verify_supabase_token)
):
    """
    List all active API keys for the authenticated user.
    """
    supabase = get_supabase()
    tenant_id = user.get("sub")
    
    try:
        response = supabase.table("api_keys").select("*").eq("tenant_id", tenant_id).eq("is_active", True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: str,
    user: dict = Depends(verify_supabase_token)
):
    """
    Revoke (deactivate) an API key.
    """
    supabase = get_supabase()
    tenant_id = user.get("sub")
    
    try:
        # Check ownership and deactivate
        result = supabase.table("api_keys").update({"is_active": False}).eq("id", key_id).eq("tenant_id", tenant_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="API key not found or not owned by user")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to revoke API key: {str(e)}")
