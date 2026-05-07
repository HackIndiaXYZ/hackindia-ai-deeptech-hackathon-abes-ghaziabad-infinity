"""
XGBoost Supervised Anomaly Classifier.

Starts weak (trained on synthetic data), but gets dramatically stronger as
real labeled production data flows in. Provides feature importance for
explainable decisions.
"""

import os
import json
import numpy as np
import xgboost as xgb
from datetime import datetime
from typing import Optional, Dict, List, Tuple
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    classification_report,
)


# ── Paths ────────────────────────────────────────────────────────────────────

_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_store")
_XGB_MODEL_PATH = os.path.join(_MODEL_DIR, "xgb_model.json")
_XGB_META_PATH = os.path.join(_MODEL_DIR, "xgb_meta.json")

FEATURE_NAMES = [
    "login_frequency",
    "failed_login_ratio",
    "time_gap",
    "geo_distance",
    "request_rate",
    "ip_change_flag",
]


# ── Model Wrapper ────────────────────────────────────────────────────────────

class SentivoyXGBModel:
    """
    Wraps XGBoost with Sentivoy-specific training, prediction,
    feature importance, and warm-start capabilities.
    """

    def __init__(self, params: Optional[Dict] = None):
        self.params = params or {
            "max_depth": 6,
            "n_estimators": 200,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "min_child_weight": 3,
            "gamma": 0.1,
            "reg_alpha": 0.1,
            "reg_lambda": 1.0,
            "objective": "binary:logistic",
            "eval_metric": "logloss",
            "random_state": 42,
            "n_jobs": -1,
        }
        self.model: Optional[xgb.XGBClassifier] = None
        self.is_fitted = False
        self.metadata: Dict = {}
        self.optimal_threshold: float = 0.5

    # ── Training ─────────────────────────────────────────────────────────

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        description: str = "initial",
    ) -> Dict:
        """
        Train the XGBoost classifier.

        Args:
            X: Feature matrix (n_samples, 6).
            y: Binary labels — 0 = normal, 1 = anomaly.
            X_val: Optional validation features.
            y_val: Optional validation labels.
            description: Label for metadata.

        Returns:
            Dict of training metrics.
        """
        # Auto-calculate class weight for imbalanced data
        n_normal = int(np.sum(y == 0))
        n_anomaly = int(np.sum(y == 1))
        scale_pos_weight = n_normal / max(n_anomaly, 1)

        self.model = xgb.XGBClassifier(
            **self.params,
            scale_pos_weight=scale_pos_weight,
        )

        eval_set = []
        if X_val is not None and y_val is not None:
            eval_set = [(X_val, y_val)]

        self.model.fit(
            X, y,
            eval_set=eval_set if eval_set else None,
            verbose=False,
        )
        self.is_fitted = True

        # Calculate metrics
        metrics = self._calculate_metrics(X, y, "train")
        if X_val is not None and y_val is not None:
            val_metrics = self._calculate_metrics(X_val, y_val, "val")
            metrics.update(val_metrics)

        self.metadata = {
            "trained_at": datetime.utcnow().isoformat(),
            "sample_count": int(X.shape[0]),
            "anomaly_count": int(n_anomaly),
            "normal_count": int(n_normal),
            "scale_pos_weight": round(scale_pos_weight, 4),
            "optimal_threshold": self.optimal_threshold,
            "description": description,
            "metrics": metrics,
        }

        return metrics

    def warm_start_fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        n_additional_rounds: int = 50,
        description: str = "incremental",
    ) -> Dict:
        """
        Incrementally train from the existing model (warm start).
        Adds new trees to the existing booster without discarding learned patterns.
        """
        if not self.is_fitted or self.model is None:
            return self.fit(X, y, description=description)

        # Get the existing booster
        existing_booster = self.model.get_booster()

        # Create DMatrix for new data
        dtrain = xgb.DMatrix(X, label=y, feature_names=FEATURE_NAMES)

        # Train additional rounds on top of existing model
        xgb_params = {
            "max_depth": self.params.get("max_depth", 6),
            "learning_rate": self.params.get("learning_rate", 0.05),  # Lower LR for fine-tuning
            "subsample": self.params.get("subsample", 0.8),
            "colsample_bytree": self.params.get("colsample_bytree", 0.8),
            "objective": "binary:logistic",
            "eval_metric": "logloss",
        }

        updated_booster = xgb.train(
            xgb_params,
            dtrain,
            num_boost_round=n_additional_rounds,
            xgb_model=existing_booster,
            verbose_eval=False,
        )

        # Update the classifier's booster
        self.model.get_booster().__dict__.update(updated_booster.__dict__)

        metrics = self._calculate_metrics(X, y, "warm_start")

        self.metadata.update({
            "last_warm_start": datetime.utcnow().isoformat(),
            "warm_start_samples": int(X.shape[0]),
            "description": description,
            "metrics": metrics,
        })

        return metrics

    # ── Inference ────────────────────────────────────────────────────────

    def predict_anomaly_score(self, features: List[float]) -> float:
        """
        Return anomaly probability in [0, 1] where higher = more anomalous.
        """
        if not self.is_fitted or self.model is None:
            return 0.0

        X = np.array([features], dtype=np.float64)
        proba = self.model.predict_proba(X)[0]
        # proba[1] = probability of class 1 (anomaly)
        return float(proba[1])

    def predict_is_anomaly(self, features: List[float]) -> bool:
        """Predict using the optimal threshold."""
        score = self.predict_anomaly_score(features)
        return score > self.optimal_threshold

    def predict_batch_scores(self, X: np.ndarray) -> np.ndarray:
        """Batch anomaly scoring."""
        if not self.is_fitted or self.model is None:
            return np.zeros(X.shape[0])
        probas = self.model.predict_proba(X)
        return probas[:, 1]

    # ── Feature Importance ───────────────────────────────────────────────

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Return feature importances as a dict.
        Useful for explainable decisions in the agent.
        """
        if not self.is_fitted or self.model is None:
            return {name: 0.0 for name in FEATURE_NAMES}

        importances = self.model.feature_importances_
        return {
            name: round(float(imp), 4)
            for name, imp in zip(FEATURE_NAMES, importances)
        }

    def get_top_contributing_features(self, features: List[float], top_n: int = 3) -> List[Tuple[str, float]]:
        """
        For a specific prediction, return the top contributing features.
        Uses feature value × global importance as a rough per-sample attribution.
        """
        importances = self.get_feature_importance()
        contributions = [
            (name, abs(val) * importances.get(name, 0.0))
            for name, val in zip(FEATURE_NAMES, features)
        ]
        contributions.sort(key=lambda x: x[1], reverse=True)
        return contributions[:top_n]

    # ── Metrics ──────────────────────────────────────────────────────────

    def _calculate_metrics(self, X: np.ndarray, y: np.ndarray, prefix: str) -> Dict:
        """Calculate classification metrics."""
        y_pred = self.model.predict(X)
        return {
            f"{prefix}_accuracy": round(float(accuracy_score(y, y_pred)), 4),
            f"{prefix}_f1": round(float(f1_score(y, y_pred, zero_division=0)), 4),
            f"{prefix}_precision": round(float(precision_score(y, y_pred, zero_division=0)), 4),
            f"{prefix}_recall": round(float(recall_score(y, y_pred, zero_division=0)), 4),
        }

    # ── Persistence ──────────────────────────────────────────────────────

    def save(self, path: Optional[str] = None, meta_path: Optional[str] = None):
        """Save model and metadata."""
        path = path or _XGB_MODEL_PATH
        meta_path = meta_path or _XGB_META_PATH
        os.makedirs(os.path.dirname(path), exist_ok=True)

        if self.model is not None:
            self.model.save_model(path)
        with open(meta_path, "w") as f:
            json.dump(self.metadata, f, indent=2)

    @classmethod
    def load(cls, path: Optional[str] = None, meta_path: Optional[str] = None) -> "SentivoyXGBModel":
        """Load a trained model from disk."""
        path = path or _XGB_MODEL_PATH
        meta_path = meta_path or _XGB_META_PATH

        instance = cls()
        if os.path.exists(path):
            instance.model = xgb.XGBClassifier()
            instance.model.load_model(path)
            instance.is_fitted = True

            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    instance.metadata = json.load(f)
                instance.optimal_threshold = instance.metadata.get("optimal_threshold", 0.5)
        else:
            print(f"[XGB] No saved model at {path}. Starting with unfitted model.")

        return instance


# ── Module-level convenience ─────────────────────────────────────────────────

def get_xgb_model_path() -> str:
    return _XGB_MODEL_PATH


def load_xgb_model() -> SentivoyXGBModel:
    """Load or initialize the XGBoost model."""
    return SentivoyXGBModel.load()
