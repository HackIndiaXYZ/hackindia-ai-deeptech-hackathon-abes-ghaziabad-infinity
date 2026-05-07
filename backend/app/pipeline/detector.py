"""
Anomaly detection module.
Runs inference on the hybrid ensemble (Isolation Forest + XGBoost).
"""

from app.ml.ensemble import get_ensemble, reload_ensemble
from app.models.schemas import FeatureVector, SeverityLevel
from typing import Dict


def detect_anomaly(features: FeatureVector) -> tuple[float, bool, SeverityLevel, Dict]:
    """
    Run ensemble inference on the feature vector.

    Returns:
        (anomaly_score, is_anomaly, base_severity, details)

    The details dict contains per-model scores, weights, feature importance,
    and top contributing features for the decision engine.
    """
    ensemble = get_ensemble()
    feature_list = features.to_list()
    score, is_anomaly, severity, details = ensemble.predict(feature_list)
    return score, is_anomaly, severity, details
