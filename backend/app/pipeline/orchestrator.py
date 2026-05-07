"""
Pipeline orchestrator.
Executes the log processing asynchronously.
"""

from app.models.schemas import LogEntry, AnomalyResult
from app.pipeline.preprocessor import extract_features
from app.pipeline.detector import detect_anomaly
from app.agent.decision_engine import evaluate_anomaly
from app.db.supabase_client import get_supabase
from app.core.config import get_settings


async def process_log_pipeline(log: LogEntry, log_id: str):
    """
    Background task to process a log through the ML/Agent pipeline.
    """
    try:
        supabase = get_supabase()
        
        # 1. Feature Engineering
        features = extract_features(log, log_id)
        
        # Store features
        try:
            supabase.table("features").insert(features.model_dump()).execute()
        except Exception as e:
            print(f"Error storing features: {e}")
            
        # 2. Anomaly Detection Inference (Hybrid Ensemble)
        score, is_anomaly, base_severity, ml_details = detect_anomaly(features)
        
        # 3. Agentic Decision
        final_severity, action, reasoning = evaluate_anomaly(
            log, features, score, is_anomaly, base_severity
        )
        
        # 4. Construct Result
        result = AnomalyResult(
            log_id=log_id,
            tenant_id=log.tenant_id,
            anomaly_score=score,
            is_anomaly=is_anomaly,
            severity=base_severity,
            final_severity=final_severity,
            action_recommendation=action,
            reasoning=reasoning
        )
        
        # 5. Store Result in Supabase
        if is_anomaly or action != "ignore":
            try:
                # Store the anomaly record
                # Exclude columns that are not completely migrated directly in the DB schema
                db_payload = result.model_dump(mode='json', exclude={'anomaly_score', 'severity', 'reasoning'})
                db_payload['reconstruction_error'] = result.anomaly_score
                supabase.table("anomalies").insert(db_payload).execute()
            except Exception as e:
                print(f"Error storing anomaly result: {e}")

        # 5.5 Take Autonomous Actions
        if action.value == "block":
            try:
                from app.agent.ip_blocker import block_ip
                block_ip(ip_address=log.ip_address, tenant_id=log.tenant_id, reason=reasoning)
            except Exception as e:
                print(f"Error executing block action: {e}")

        # 6. Fan-out alerts to all connected MCP integrations
        if is_anomaly and final_severity.value in ("critical", "high", "medium"):
            try:
                from app.services.mcp_client import dispatch_alerts
                await dispatch_alerts(
                    tenant_id=log.tenant_id or "",
                    user_id=log.user_id,
                    ip_address=log.ip_address,
                    event_type=log.event_type.value,
                    severity=final_severity.value,
                    action=action.value,
                    reasoning=reasoning,
                    score=score,
                    timestamp=log.timestamp.isoformat(),
                )
            except Exception as e:
                print(f"Error dispatching MCP alerts: {e}")

        # 7. Send Email Alert for Critical/High severity anomalies
        if is_anomaly and final_severity.value in ("critical", "high") and action.value in ("block", "flag"):
            try:
                _send_anomaly_alert(supabase, log, result)
            except Exception as e:
                print(f"Error sending alert email: {e}")
                
    except Exception as e:
        print(f"Pipeline error for log {log_id}: {e}")


def _send_anomaly_alert(supabase, log: LogEntry, result: AnomalyResult):
    """
    Look up the user's email and send a critical alert notification via Resend.
    """
    settings = get_settings()
    if not settings.alert_email_enabled or not settings.resend_api_key:
        return

    # Look up user email from Supabase Auth
    user_email = None
    try:
        if log.tenant_id:
            user_res = supabase.auth.admin.get_user_by_id(log.tenant_id)
            if user_res and user_res.user and user_res.user.email:
                user_email = user_res.user.email
    except Exception as e:
        print(f"[Email] Could not look up user email for tenant {log.tenant_id}: {e}")

    if not user_email:
        print(f"[Email] No email found for tenant {log.tenant_id}, skipping alert.")
        return

    # Send the alert
    from app.services.email_service import send_critical_alert_email

    send_critical_alert_email(
        to_email=user_email,
        user_id=log.user_id,
        severity=result.final_severity.value,
        anomaly_score=result.anomaly_score,
        action=result.action_recommendation.value,
        reasoning=result.reasoning,
        event_type=log.event_type.value,
        ip_address=log.ip_address,
        timestamp=log.timestamp.isoformat(),
    )

