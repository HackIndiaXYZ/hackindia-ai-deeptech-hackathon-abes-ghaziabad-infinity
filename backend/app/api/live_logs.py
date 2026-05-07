"""
Live Logs API Route.
Streams recent raw log events from the database for real-time display.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional

from app.db.supabase_client import get_supabase
from app.core.security import verify_supabase_token


router = APIRouter(prefix="/api/live-logs", tags=["Live Logs"])


@router.get("")
async def get_live_logs(
    limit: int = Query(100, ge=1, le=500),
    level: Optional[str] = Query(None, description="Filter by level: info, warn, error, critical"),
    user: dict = Depends(verify_supabase_token),
):
    """
    Fetch recent log events for the authenticated user's tenant.
    Returns logs joined with their anomaly data for severity classification.
    """
    supabase = get_supabase()
    tenant_id = user.get("sub")

    if not tenant_id:
        raise HTTPException(status_code=401, detail="User ID missing from token")

    try:
        # Fetch recent logs
        query = (
            supabase.table("logs")
            .select("*")
            .eq("tenant_id", tenant_id)
            .order("timestamp", desc=True)
            .limit(limit)
        )
        logs_res = query.execute()
        logs = logs_res.data

        # Fetch anomalies for these logs to determine severity
        log_ids = [log["id"] for log in logs]
        anomaly_map = {}
        if log_ids:
            anom_res = (
                supabase.table("anomalies")
                .select("log_id, final_severity, action_recommendation, reasoning, anomaly_score")
                .in_("log_id", log_ids)
                .execute()
            )
            anomaly_map = {a["log_id"]: a for a in anom_res.data}

        # Map to live log format
        result = []
        for log in logs:
            anomaly = anomaly_map.get(log["id"])

            # Determine log level based on anomaly data
            if anomaly:
                sev = anomaly.get("final_severity", "low")
                if sev == "critical":
                    log_level = "critical"
                elif sev == "high":
                    log_level = "error"
                elif sev == "medium":
                    log_level = "warn"
                else:
                    log_level = "info"
            else:
                # Non-anomalous: check status
                log_level = "warn" if log.get("status") == "failure" else "info"

            # Apply level filter
            if level and log_level != level:
                continue

            # Build display message
            event_type = log.get("event_type", "unknown")
            status = log.get("status", "unknown")
            ip = log.get("ip_address", "unknown")
            user_id = log.get("user_id", "unknown")

            if anomaly:
                action = anomaly.get("action_recommendation", "monitor")
                reasoning = anomaly.get("reasoning", "")
                score = anomaly.get("anomaly_score", 0)
                msg = f"{event_type} {status} user={user_id} ip={ip} score={score:.4f} action={action} — {reasoning}"
            else:
                msg = f"{event_type} {status} user={user_id} ip={ip}"

            # Parse timestamp for display
            ts = log.get("timestamp", "")

            result.append({
                "id": log["id"],
                "ts": ts,
                "level": log_level,
                "source": event_type.replace("_", "-"),
                "msg": msg,
                "userId": user_id,
                "ip": ip,
                "eventType": event_type,
                "status": status,
                "anomaly": anomaly,
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch live logs: {str(e)}")
