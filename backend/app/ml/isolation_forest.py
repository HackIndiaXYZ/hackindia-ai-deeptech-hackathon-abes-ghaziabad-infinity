"""
Isolation Forest — Unsupervised Anomaly Detection.

Works from day one without labeled data. Learns the "shape" of normal traffic
and flags statistical outliers. Acts as the safety-net model that catches
novel attack patterns the supervised model has never seen.
"""

import os
import json
import numpy as np
import joblib
from datetime import datetime
from sklearn.ensemble import IsolationForest as SklearnIsolationForest
from typing import Optional, Dict, List


# ── Paths ────────────────────────────────────────────────────────────────────

_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_store")
_IF_MODEL_PATH = os.path.join(_MODEL_DIR, "isolation_forest.joblib")
_IF_META_PATH = os.path.join(_MODEL_DIR, "isolation_forest_meta.json")

FEATURE_NAMES = [
    "login_frequency",
    "failed_login_ratio",
    "time_gap",
    "geo_distance",
    "request_rate",
    "ip_change_flag",
]


# ── Model Wrapper ────────────────────────────────────────────────────────────

class SentivoyIsolationForest:
    """
    Wraps scikit-learn IsolationForest with persistence, metadata tracking,
    and a clean predict interface for the ensemble.
    """

    def __init__(
        self,
        n_estimators: int = 200,
        contamination: float = 0.05,
        max_features: float = 1.0,
        random_state: int = 42,
    ):
        self.model = SklearnIsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            max_features=max_features,
            random_state=random_state,
            n_jobs=-1,  # Use all cores
        )
        self.is_fitted = False
        self.metadata: Dict = {}

    # ── Training ─────────────────────────────────────────────────────────

    def fit(self, X: np.ndarray, sample_description: str = "initial") -> "SentivoyIsolationForest":
        """
        Train (or retrain) the Isolation Forest on normal data.

        Args:
            X: Feature matrix of shape (n_samples, 6).
            sample_description: Label for metadata tracking.
        """
        self.model.fit(X)
        self.is_fitted = True

        self.metadata = {
            "trained_at": datetime.utcnow().isoformat(),
            "sample_count": int(X.shape[0]),
            "n_estimators": self.model.n_estimators,
            "contamination": float(self.model.contamination),
            "description": sample_description,
        }
        return self

    # ── Inference ────────────────────────────────────────────────────────

    def predict_anomaly_score(self, features: List[float]) -> float:
        """
        Return an anomaly score in [0, 1] where higher = more anomalous.

        Scikit-learn's decision_function returns negative scores for anomalies.
        We invert and normalize to [0, 1] for the ensemble.
        """
        if not self.is_fitted:
            return 0.0

        X = np.array([features], dtype=np.float64)
        # decision_function: negative = anomaly, positive = normal
        raw_score = self.model.decision_function(X)[0]

        # Convert to [0, 1] where 1 = most anomalous
        # Typical raw scores range from about -0.5 (anomaly) to +0.5 (normal)
        # We use a sigmoid-like mapping for smooth normalization
        normalized = 1.0 / (1.0 + np.exp(5.0 * raw_score))
        return float(np.clip(normalized, 0.0, 1.0))

    def predict_is_anomaly(self, features: List[float]) -> bool:
        """Direct anomaly prediction using sklearn's built-in threshold."""
        if not self.is_fitted:
            return False
        X = np.array([features], dtype=np.float64)
        prediction = self.model.predict(X)[0]
        return prediction == -1  # -1 = anomaly in sklearn convention

    def predict_batch_scores(self, X: np.ndarray) -> np.ndarray:
        """
        Batch scoring for retraining evaluation.
        Returns array of anomaly scores in [0, 1].
        """
        if not self.is_fitted:
            return np.zeros(X.shape[0])

        raw_scores = self.model.decision_function(X)
        normalized = 1.0 / (1.0 + np.exp(5.0 * raw_scores))
        return np.clip(normalized, 0.0, 1.0)

    # ── Persistence ──────────────────────────────────────────────────────

    def save(self, path: Optional[str] = None, meta_path: Optional[str] = None):
        """Save model and metadata to disk."""
        path = path or _IF_MODEL_PATH
        meta_path = meta_path or _IF_META_PATH
        os.makedirs(os.path.dirname(path), exist_ok=True)

        joblib.dump(self.model, path)
        with open(meta_path, "w") as f:
            json.dump(self.metadata, f, indent=2)

    @classmethod
    def load(cls, path: Optional[str] = None, meta_path: Optional[str] = None) -> "SentivoyIsolationForest":
        """Load a trained model from disk."""
        path = path or _IF_MODEL_PATH
        meta_path = meta_path or _IF_META_PATH

        instance = cls()
        if os.path.exists(path):
            instance.model = joblib.load(path)
            instance.is_fitted = True
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    instance.metadata = json.load(f)
        else:
            print(f"[IF] No saved model at {path}. Starting with unfitted model.")

        return instance


# ── Module-level convenience ─────────────────────────────────────────────────

def get_if_model_path() -> str:
    return _IF_MODEL_PATH


def load_isolation_forest() -> SentivoyIsolationForest:
    """Load or initialize the Isolation Forest model."""
    return SentivoyIsolationForest.load()
