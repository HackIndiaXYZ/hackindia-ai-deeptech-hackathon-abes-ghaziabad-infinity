"""
Email service using Resend SDK.
Sends branded alert emails when critical disturbances are detected.
"""

import resend
from typing import Optional
from app.core.config import get_settings
from app.services.email_templates import critical_alert_html


def _init_resend():
    """Initialize Resend with API key from settings."""
    settings = get_settings()
    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is not set in environment variables.")
    resend.api_key = settings.resend_api_key


def send_critical_alert_email(
    to_email: str,
    user_id: str,
    severity: str,
    anomaly_score: float,
    action: str,
    reasoning: str,
    event_type: str,
    ip_address: str,
    timestamp: str,
) -> Optional[dict]:
    """
    Send a critical/high severity anomaly alert email via Resend.

    Args:
        to_email: Recipient email address
        user_id: The affected user ID
        severity: Alert severity (critical/high)
        anomaly_score: ML model anomaly score
        action: Recommended action (block/flag)
        reasoning: AI decision reasoning
        event_type: Type of event that triggered the alert
        ip_address: Source IP address
        timestamp: Event timestamp

    Returns:
        Resend API response dict, or None on failure
    """
    settings = get_settings()

    if not settings.alert_email_enabled:
        print("[Email] Alert emails are disabled via config.")
        return None

    try:
        _init_resend()

        html_body = critical_alert_html(
            user_id=user_id,
            severity=severity,
            anomaly_score=anomaly_score,
            action=action,
            reasoning=reasoning,
            event_type=event_type,
            ip_address=ip_address,
            timestamp=timestamp,
            dashboard_url=settings.frontend_url,
        )

        severity_upper = severity.upper()
        subject = f"🚨 [{severity_upper}] Security Alert — Anomalous activity detected on your platform"

        params: resend.Emails.SendParams = {
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }

        response = resend.Emails.send(params)
        print(f"[Email] Alert sent to {to_email} — Resend ID: {response}")
        return response

    except Exception as e:
        print(f"[Email] Failed to send alert email to {to_email}: {e}")
        return None


def send_report_email(
    to_email: str,
    pdf_bytes: bytes,
    tenant_id: str,
    report_name: str = "sentivoy_security_report.pdf",
) -> Optional[dict]:
    """
    Send the PDF status report as an email attachment.

    Args:
        to_email: Recipient email
        pdf_bytes: Generated PDF as bytes
        tenant_id: Tenant identifier
        report_name: Filename for the PDF attachment

    Returns:
        Resend API response dict, or None on failure
    """
    settings = get_settings()

    try:
        _init_resend()

        import base64
        pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")

        params: resend.Emails.SendParams = {
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": "📊 Your Sentivoy Security Status Report",
            "html": f"""
            <div style="font-family:sans-serif;background:#09090b;color:#fafafa;padding:40px;text-align:center;">
                <h1 style="color:#8b5cf6;">Your Security Report is Ready</h1>
                <p style="color:#a1a1aa;font-size:14px;">
                    Please find your Sentivoy security status report attached to this email.
                </p>
                <p style="color:#71717a;font-size:12px;margin-top:24px;">
                    &copy; 2026 Sentivoy &middot; AI-Powered Cybersecurity
                </p>
            </div>
            """,
            "attachments": [
                {
                    "filename": report_name,
                    "content": list(pdf_bytes),
                }
            ],
        }

        response = resend.Emails.send(params)
        print(f"[Email] Report sent to {to_email} — Resend ID: {response}")
        return response

    except Exception as e:
        print(f"[Email] Failed to send report email to {to_email}: {e}")
        return None
