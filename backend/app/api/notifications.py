"""
Notifications API Route.
Handles email alert testing and notification preferences.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.db.supabase_client import get_supabase
from app.core.security import verify_supabase_token
from app.services.email_service import send_critical_alert_email
from app.core.config import get_settings


router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class TestAlertRequest(BaseModel):
    """Request body for sending a test alert email."""
    email_override: Optional[str] = None  # Optional: send to a different email


class TestAlertResponse(BaseModel):
    """Response after sending a test alert."""
    success: bool
    message: str
    email_sent_to: Optional[str] = None


@router.post("/test", response_model=TestAlertResponse)
async def send_test_alert(
    payload: Optional[TestAlertRequest] = None,
    user: dict = Depends(verify_supabase_token),
):
    """
    Send a test critical alert email to the authenticated user's email.
    Useful for verifying email configuration and previewing templates.
    """
    settings = get_settings()

    if not settings.resend_api_key:
        raise HTTPException(
            status_code=503,
            detail="Email service not configured. Set RESEND_API_KEY in .env."
        )

    # Get user email
    user_email = user.get("email")

    if payload and payload.email_override:
        user_email = payload.email_override

    if not user_email:
        # Try to fetch from Supabase Auth
        try:
            supabase = get_supabase()
            user_id = user.get("sub")
            res = supabase.auth.admin.get_user_by_id(user_id)
            if res and res.user:
                user_email = res.user.email
        except Exception:
            pass

    if not user_email:
        raise HTTPException(
            status_code=400,
            detail="Could not determine user email. Provide email_override."
        )

    # Send test alert
    result = send_critical_alert_email(
        to_email=user_email,
        user_id=user.get("sub", "test-user"),
        severity="critical",
        anomaly_score=0.1847,
        action="block",
        reasoning="TEST ALERT: This is a test notification from Sentivoy. Admin account exhibiting highly anomalous behavior. Impossible travel detected (large geo distance).",
        event_type="login",
        ip_address="198.51.100.42",
        timestamp="2026-04-25T06:30:00Z",
    )

    if result:
        return TestAlertResponse(
            success=True,
            message="Test alert email sent successfully!",
            email_sent_to=user_email,
        )
    else:
        return TestAlertResponse(
            success=False,
            message="Failed to send test alert. Check server logs for details.",
        )


@router.get("/status")
async def get_notification_status(user: dict = Depends(verify_supabase_token)):
    """
    Check the notification service configuration status.
    """
    settings = get_settings()

    return {
        "email_enabled": settings.alert_email_enabled,
        "email_configured": bool(settings.resend_api_key),
        "from_address": settings.resend_from_email,
    }
