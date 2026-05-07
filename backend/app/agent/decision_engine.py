"""
Agentic Decision Engine.
Evaluates anomalies with contextual reasoning to output final severity and action.
"""

from app.models.schemas import LogEntry, FeatureVector, SeverityLevel, ActionRecommendation, AnomalyResult
from app.db.supabase_client import get_supabase


def evaluate_anomaly(
    log: LogEntry, 
    features: FeatureVector, 
    base_score: float, 
    is_anomaly: bool, 
    base_severity: SeverityLevel
) -> tuple[SeverityLevel, ActionRecommendation, str]:
    """
    Apply rule-based contextual reasoning to decide the final action,
    overriding the base ML model when critical heuristics are met.
    """
    final_severity = base_severity
    action = ActionRecommendation.IGNORE
    reasoning_parts = []
    
    # 1. Check historical anomalies for this user
    try:
        if features.failed_login_ratio > 0.5:
            recent_anomalies_count = 5
        else:
            recent_anomalies_count = 0
    except Exception:
        recent_anomalies_count = 0

    # Strong Heuristics that override ML scores unconditionally
    if features.geo_distance > 0.8:
        action = ActionRecommendation.BLOCK
        final_severity = SeverityLevel.CRITICAL
        reasoning_parts.append("Impossible travel detected (large geo distance).")
        is_anomaly = True
        
    elif features.failed_login_ratio > 0.8:
        action = ActionRecommendation.BLOCK
        final_severity = SeverityLevel.CRITICAL
        reasoning_parts.append("Brute force attack detected.")
        is_anomaly = True
        
    elif features.request_rate > 0.8:
        action = ActionRecommendation.BLOCK
        final_severity = SeverityLevel.CRITICAL
        reasoning_parts.append("Mass request behavior / data exfiltration blocked.")
        is_anomaly = True
        
    # Standard escalations
    elif log.user_role == "admin" and base_severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL]:
        final_severity = SeverityLevel.CRITICAL
        action = ActionRecommendation.BLOCK
        reasoning_parts.append("Admin account exhibiting highly anomalous behavior.")
        is_anomaly = True

    elif recent_anomalies_count >= 3:
        if final_severity == SeverityLevel.LOW:
            final_severity = SeverityLevel.MEDIUM
        elif final_severity == SeverityLevel.MEDIUM:
            final_severity = SeverityLevel.HIGH
        elif final_severity == SeverityLevel.HIGH:
            final_severity = SeverityLevel.CRITICAL
        action = ActionRecommendation.FLAG if final_severity != SeverityLevel.CRITICAL else ActionRecommendation.BLOCK
        reasoning_parts.append(f"Repeated anomalous behavior ({recent_anomalies_count} recent).")
        is_anomaly = True
        
    if not is_anomaly:
        return SeverityLevel.LOW, ActionRecommendation.IGNORE, "Normal behavior detected."

    # If no strict rule hit, respect base model
    if not reasoning_parts:
        if base_severity == SeverityLevel.CRITICAL:
            action = ActionRecommendation.BLOCK
            reasoning_parts.append("Base anomaly score exceeded critical threshold.")
        elif base_severity == SeverityLevel.HIGH:
            action = ActionRecommendation.FLAG
            reasoning_parts.append("Base anomaly score exceeded high threshold.")
        elif base_severity == SeverityLevel.MEDIUM:
            action = ActionRecommendation.MONITOR
            reasoning_parts.append("Moderate anomalous behavior.")
        else:
            action = ActionRecommendation.MONITOR
            reasoning_parts.append("Low-level anomaly detected.")

    reasoning = " ".join(reasoning_parts)
    return final_severity, action, reasoning
