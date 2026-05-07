"""
Ensemble Combiner — Dynamic Weighted Anomaly Detection.

Combines Isolation Forest (unsupervised) and XGBoost (supervised) scores.
Weights shift automatically based on model confidence and maturity.
"""

import os
import json
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from app.ml.isolation_forest import SentivoyIsolationForest, load_isolation_forest
from app.ml.xgb_model import SentivoyXGBModel, load_xgb_model, FEATURE_NAMES
from app.models.schemas import SeverityLevel

_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_store")
_ENSEMBLE_META_PATH = os.path.join(_MODEL_DIR, "ensemble_meta.json")


class SentivoyEnsemble:
    XGB_TRUST_THRESHOLD = 200
    XGB_MATURE_THRESHOLD = 2000

    def __init__(self):
        self.if_model: Optional[SentivoyIsolationForest] = None
        self.xgb_model: Optional[SentivoyXGBModel] = None
        self.w_if: float = 0.9
        self.w_xgb: float = 0.1
        self.threshold: float = 0.5
        self.metadata: Dict = {}

    def load_models(self):
        self.if_model = load_isolation_forest()
        self.xgb_model = load_xgb_model()
        self._update_weights()
        self._load_meta()

    def _update_weights(self):
        if self.xgb_model is None or not self.xgb_model.is_fitted:
            self.w_if, self.w_xgb = 0.95, 0.05
            return
        xgb_meta = self.xgb_model.metadata
        sample_count = xgb_meta.get("sample_count", 0)
        xgb_f1 = xgb_meta.get("metrics", {}).get("train_f1", 0.0)
        if sample_count < self.XGB_TRUST_THRESHOLD:
            self.w_if, self.w_xgb = 0.85, 0.15
        elif sample_count < self.XGB_MATURE_THRESHOLD:
            progress = (sample_count - self.XGB_TRUST_THRESHOLD) / (self.XGB_MATURE_THRESHOLD - self.XGB_TRUST_THRESHOLD)
            self.w_xgb = 0.15 + progress * 0.50
            self.w_if = 1.0 - self.w_xgb
        else:
            self.w_xgb, self.w_if = 0.70, 0.30
        if xgb_f1 < 0.5 and sample_count > self.XGB_TRUST_THRESHOLD:
            self.w_xgb = max(0.15, self.w_xgb * 0.5)
            self.w_if = 1.0 - self.w_xgb

    def predict(self, features: List[float]) -> Tuple[float, bool, SeverityLevel, Dict]:
        if_score, xgb_score = 0.0, 0.0
        if self.if_model and self.if_model.is_fitted:
            if_score = self.if_model.predict_anomaly_score(features)
        if self.xgb_model and self.xgb_model.is_fitted:
            xgb_score = self.xgb_model.predict_anomaly_score(features)
        ensemble_score = self.w_if * if_score + self.w_xgb * xgb_score
        is_anomaly = ensemble_score > self.threshold
        severity = self._score_to_severity(ensemble_score)
        feature_importance = {}
        top_features = []
        if self.xgb_model and self.xgb_model.is_fitted:
            feature_importance = self.xgb_model.get_feature_importance()
            top_features = self.xgb_model.get_top_contributing_features(features, top_n=3)
        details = {
            "ensemble_score": round(ensemble_score, 6),
            "if_score": round(if_score, 6),
            "xgb_score": round(xgb_score, 6),
            "w_if": round(self.w_if, 4),
            "w_xgb": round(self.w_xgb, 4),
            "threshold": self.threshold,
            "feature_importance": feature_importance,
            "top_contributing_features": [
                {"feature": name, "contribution": round(val, 4)} for name, val in top_features
            ],
        }
        return ensemble_score, is_anomaly, severity, details

    def predict_batch(self, X: np.ndarray) -> np.ndarray:
        if_scores = np.zeros(X.shape[0])
        xgb_scores = np.zeros(X.shape[0])
        if self.if_model and self.if_model.is_fitted:
            if_scores = self.if_model.predict_batch_scores(X)
        if self.xgb_model and self.xgb_model.is_fitted:
            xgb_scores = self.xgb_model.predict_batch_scores(X)
        return self.w_if * if_scores + self.w_xgb * xgb_scores

    def _score_to_severity(self, score: float) -> SeverityLevel:
        if score < self.threshold:
            return SeverityLevel.LOW
        elif score < self.threshold + 0.15:
            return SeverityLevel.MEDIUM
        elif score < self.threshold + 0.30:
            return SeverityLevel.HIGH
        else:
            return SeverityLevel.CRITICAL

    def get_status(self) -> Dict:
        return {
            "ensemble": {"weights": {"isolation_forest": self.w_if, "xgboost": self.w_xgb}, "threshold": self.threshold},
            "isolation_forest": {"fitted": self.if_model.is_fitted if self.if_model else False, "metadata": self.if_model.metadata if self.if_model else {}},
            "xgboost": {
                "fitted": self.xgb_model.is_fitted if self.xgb_model else False,
                "metadata": self.xgb_model.metadata if self.xgb_model else {},
                "feature_importance": self.xgb_model.get_feature_importance() if self.xgb_model and self.xgb_model.is_fitted else {},
            },
        }

    def save_meta(self):
        os.makedirs(os.path.dirname(_ENSEMBLE_META_PATH), exist_ok=True)
        with open(_ENSEMBLE_META_PATH, "w") as f:
            json.dump({"w_if": self.w_if, "w_xgb": self.w_xgb, "threshold": self.threshold, "updated_at": datetime.utcnow().isoformat()}, f, indent=2)

    def _load_meta(self):
        if os.path.exists(_ENSEMBLE_META_PATH):
            try:
                with open(_ENSEMBLE_META_PATH, "r") as f:
                    meta = json.load(f)
                self.threshold = meta.get("threshold", 0.5)
            except Exception:
                pass


_ensemble_instance: Optional[SentivoyEnsemble] = None

def get_ensemble() -> SentivoyEnsemble:
    global _ensemble_instance
    if _ensemble_instance is None:
        _ensemble_instance = SentivoyEnsemble()
        _ensemble_instance.load_models()
    return _ensemble_instance

def reload_ensemble():
    global _ensemble_instance
    _ensemble_instance = SentivoyEnsemble()
    _ensemble_instance.load_models()
    print(f"[Ensemble] Reloaded. Weights: IF={_ensemble_instance.w_if:.2f}, XGB={_ensemble_instance.w_xgb:.2f}")
