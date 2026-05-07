"""
Basic integration test for the ML pipeline.
"""

from app.models.schemas import LogEntry
from app.pipeline.preprocessor import extract_features
from app.pipeline.detector import detect_anomaly
from app.agent.decision_engine import evaluate_anomaly
import datetime

def test_pipeline_execution():
    """Ensure the pipeline logic runs without throwing exceptions on mock data."""
    log = LogEntry(
        user_id="test_user",
        ip_address="127.0.0.1",
        timestamp=datetime.datetime.utcnow(),
        event_type="login",
        status="success"
    )
    
    # 1. Feature Extraction
    features = extract_features(log, "mock_id")
    assert features.log_id == "mock_id"
    
    # 2. Anomaly Detection
    score, is_anomaly, severity = detect_anomaly(features)
    assert isinstance(score, float)
    
    # 3. Agent Evaluation
    final_sev, action, reason = evaluate_anomaly(log, features, score, is_anomaly, severity)
    assert final_sev.value in ["low", "medium", "high", "critical"]

if __name__ == "__main__":
    test_pipeline_execution()
    print("Pipeline test passed successfully!")
