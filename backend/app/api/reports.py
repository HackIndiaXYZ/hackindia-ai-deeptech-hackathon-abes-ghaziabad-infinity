"""
Reports API Route.
Generates and serves PDF security status reports.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from collections import defaultdict
import io

from app.db.supabase_client import get_supabase
from app.core.security import verify_supabase_token
from app.services.report_generator import generate_status_report_pdf
from app.services.email_service import send_report_email


router = APIRouter(prefix="/api/reports", tags=["Reports"])

async def _generate_user_pdf(supabase, tenant_id: str, user_email: str) -> bytes:
    # ── Fetch anomalies ──
    anom_res = supabase.table("anomalies").select("*").eq("tenant_id", tenant_id).execute()
    anomalies_data = anom_res.data

    # ── Fetch associated logs ──
    log_ids = [a["log_id"] for a in anomalies_data]
    logs_data = {}
    if log_ids:
        logs_res = supabase.table("logs").select("*").in_("id", log_ids).execute()
        logs_data = {log["id"]: log for log in logs_res.data}

    # ── Total log count ──
    total_logs_res = supabase.table("logs").select("id", count="exact").eq("tenant_id", tenant_id).execute()
    total_logs = total_logs_res.count if total_logs_res.count is not None else 0

    # ── Compute metrics ──
    anomalies_count = len(anomalies_data)
    critical_count = sum(1 for a in anomalies_data if a.get("final_severity") == "critical")
    threats_count = sum(1 for a in anomalies_data if a.get("is_anomaly"))
    blocked_count = sum(1 for a in anomalies_data if a.get("action_recommendation") == "block")

    metrics = {
        "logs": total_logs,
        "anomalies": anomalies_count,
        "critical": critical_count,
        "threats": threats_count,
        "blocked": blocked_count,
    }

    # ── Threat patterns ──
    event_counts = defaultdict(int)
    for a in anomalies_data:
        log = logs_data.get(a["log_id"])
        if log and a.get("is_anomaly"):
            event_counts[log["event_type"]] += 1

    threat_patterns = [
        {"name": k.replace("_", " ").title(), "value": v}
        for k, v in sorted(event_counts.items(), key=lambda item: item[1], reverse=True)
    ]

    # ── Geo origins (using mock resolver from dashboard) ──
    geo_mapping = [
        ("United States", "US"), ("Russia", "RU"), ("China", "CN"),
        ("Brazil", "BR"), ("Germany", "DE"),
    ]
    geo_counts = defaultdict(int)
    for a in anomalies_data:
        log = logs_data.get(a["log_id"])
        if log and a.get("is_anomaly"):
            idx = len(log.get("ip_address", "")) % len(geo_mapping)
            country, code = geo_mapping[idx]
            geo_counts[country] += 1

    geo_origins = []
    for country, count in geo_counts.items():
        intensity = "critical" if count > 10 else "high" if count > 5 else "medium"
        geo_origins.append({
            "country": country,
            "threats": count,
            "intensity": intensity,
        })

    # ── Generate PDF ──
    pdf_bytes = generate_status_report_pdf(
        tenant_id=tenant_id,
        user_email=user_email,
        metrics=metrics,
        anomalies_data=anomalies_data,
        logs_data=logs_data,
        threat_patterns=threat_patterns,
        geo_origins=geo_origins,
    )
    return pdf_bytes


@router.get("/pdf")
async def download_pdf_report(user: dict = Depends(verify_supabase_token)):
    """
    Generate and download a PDF security status report for the authenticated user.
    Aggregates data from logs, anomalies tables and produces a professional report.
    """
    supabase = get_supabase()
    tenant_id = user.get("sub")
    user_email = user.get("email", "unknown@sentivoy.dev")

    if not tenant_id:
        raise HTTPException(status_code=401, detail="User ID missing from token")

    try:
        pdf_bytes = await _generate_user_pdf(supabase, tenant_id, user_email)

        # Return as downloadable file
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=sentivoy_security_report.pdf",
                "Content-Length": str(len(pdf_bytes)),
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.post("/email")
async def email_pdf_report(user: dict = Depends(verify_supabase_token)):
    """
    Generate and email a PDF security summary report to the user.
    """
    supabase = get_supabase()
    tenant_id = user.get("sub")
    user_email = user.get("email")

    if not tenant_id:
        raise HTTPException(status_code=401, detail="User ID missing from token")
    if not user_email:
        # Try to look up using the ID
        try:
            res = supabase.auth.admin.get_user_by_id(tenant_id)
            if res and res.user:
                user_email = res.user.email
        except Exception:
            pass
            
    if not user_email:
        raise HTTPException(status_code=400, detail="Could not determine user email.")

    try:
        pdf_bytes = await _generate_user_pdf(supabase, tenant_id, user_email)
        
        response = send_report_email(
            to_email=user_email,
            pdf_bytes=pdf_bytes,
            tenant_id=tenant_id
        )
        
        if not response:
            raise HTTPException(status_code=500, detail="Failed to send email. Check Resend configuration.")
            
        return {"success": True, "message": "Report emailed successfully", "email": user_email}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process email report: {str(e)}")
