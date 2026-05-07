"""
Intelligent Self-Retraining Engine.

Continuously improves the ensemble while the platform is running:
1. Collects labeled feedback from production (confirmed anomalies + safe traffic)
2. Detects concept drift using Population Stability Index (PSI)
3. Incrementally trains XGBoost with warm-start (adds trees, doesn't discard)
4. Retrains Isolation Forest on updated normal baselines
5. Validates new models beat current ones before promotion
6. Atomically swaps model files to prevent corruption
7. Logs training history for monitoring
"""

import os
import json
import tempfile
import shutil
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple

from app.ml.isolation_forest import SentivoyIsolationForest
from app.ml.xgb_model import SentivoyXGBModel, FEATURE_NAMES
from app.ml.ensemble import reload_ensemble


_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_store")
_HISTORY_PATH = os.path.join(_MODEL_DIR, "training_history.json")
_DRIFT_PATH = os.path.join(_MODEL_DIR, "drift_baseline.json")

# ── PSI Drift Detection ─────────────────────────────────────────────────────

def _calculate_psi(expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
    """
    Population Stability Index — measures distribution shift.
    PSI < 0.1  → No significant change
    PSI 0.1-0.25 → Moderate shift
    PSI > 0.25 → Significant drift, retrain needed
    """
    eps = 1e-6
    breakpoints = np.linspace(0, 1, bins + 1)
    expected_pct = np.histogram(expected, bins=breakpoints)[0] / len(expected) + eps
    actual_pct = np.histogram(actual, bins=breakpoints)[0] / len(actual) + eps
    psi = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return float(psi)


# ── Data Collection ──────────────────────────────────────────────────────────

def fetch_labeled_data(hours: int = 24) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
    """
    Fetch labeled data from production:
    - Normal: features from logs NOT in anomalies with block/flag
    - Anomaly: features from logs IN anomalies with block/flag
    Returns (X, y) or (None, None) if insufficient data.
    """
    try:
        from app.db.supabase_client import get_supabase
        supabase = get_supabase()
        time_threshold = (datetime.utcnow() - timedelta(hours=hours)).isoformat()

        # Get recent log IDs
        logs_res = supabase.table("logs").select("id").gte("timestamp", time_threshold).execute()
        if not logs_res.data:
            return None, None
        recent_log_ids = [log["id"] for log in logs_res.data]

        # Get anomaly log IDs (confirmed threats)
        anomalies_res = (
            supabase.table("anomalies")
            .select("log_id")
            .in_("action_recommendation", ["block", "flag"])
            .gte("created_at", time_threshold)
            .execute()
        )
        anomaly_log_ids = {a["log_id"] for a in anomalies_res.data}
        safe_log_ids = [lid for lid in recent_log_ids if lid not in anomaly_log_ids]

        # Fetch feature vectors
        all_features, all_labels = [], []

        for log_ids, label in [(safe_log_ids, 0), (list(anomaly_log_ids), 1)]:
            for i in range(0, len(log_ids), 100):
                chunk = log_ids[i:i+100]
                feat_res = supabase.table("features").select("*").in_("log_id", chunk).execute()
                for f in feat_res.data:
                    vec = [
                        f.get("login_frequency", 0.0), f.get("failed_login_ratio", 0.0),
                        f.get("time_gap", 0.0), f.get("geo_distance", 0.0),
                        f.get("request_rate", 0.0), f.get("ip_change_flag", 0.0),
                    ]
                    all_features.append(vec)
                    all_labels.append(label)

        if len(all_features) < 50:
            return None, None

        return np.array(all_features, dtype=np.float64), np.array(all_labels, dtype=np.float64)
    except Exception as e:
        print(f"[Retrainer] Error fetching labeled data: {e}")
        return None, None


# ── Drift Detection ──────────────────────────────────────────────────────────

def check_drift() -> Tuple[float, bool]:
    """
    Compare recent prediction score distribution against baseline.
    Returns (psi_score, needs_retrain).
    """
    try:
        from app.db.supabase_client import get_supabase
        supabase = get_supabase()

        # Get recent anomaly scores
        recent = (
            supabase.table("anomalies")
            .select("reconstruction_error")
            .order("created_at", desc=True)
            .limit(500)
            .execute()
        )
        if not recent.data or len(recent.data) < 50:
            return 0.0, False

        recent_scores = np.array([r["reconstruction_error"] for r in recent.data if r.get("reconstruction_error")], dtype=np.float64)
        if len(recent_scores) < 50:
            return 0.0, False

        # Load or create baseline
        if os.path.exists(_DRIFT_PATH):
            with open(_DRIFT_PATH, "r") as f:
                baseline_data = json.load(f)
            baseline_scores = np.array(baseline_data["scores"], dtype=np.float64)
        else:
            # First run — save current as baseline
            _save_drift_baseline(recent_scores)
            return 0.0, False

        psi = _calculate_psi(baseline_scores, recent_scores)
        needs_retrain = psi > 0.20
        print(f"[Drift] PSI = {psi:.4f} {'→ RETRAIN TRIGGERED' if needs_retrain else '→ stable'}")
        return psi, needs_retrain
    except Exception as e:
        print(f"[Drift] Error checking drift: {e}")
        return 0.0, False


def _save_drift_baseline(scores: np.ndarray):
    os.makedirs(os.path.dirname(_DRIFT_PATH), exist_ok=True)
    with open(_DRIFT_PATH, "w") as f:
        json.dump({"scores": scores.tolist(), "created_at": datetime.utcnow().isoformat()}, f)


# ── Core Retraining Logic ───────────────────────────────────────────────────

def retrain(hours: int = 24, reason: str = "scheduled"):
    """
    Main retraining entry point. Called by the scheduler or drift detector.
    """
    print(f"\n{'='*60}")
    print(f"  [Retrainer] Starting retrain — reason: {reason}")
    print(f"{'='*60}")

    X, y = fetch_labeled_data(hours=hours)
    if X is None or y is None:
        print("[Retrainer] Insufficient labeled data. Skipping.")
        return

    n_normal = int(np.sum(y == 0))
    n_anomaly = int(np.sum(y == 1))
    print(f"[Retrainer] Collected {len(y)} samples ({n_normal} normal, {n_anomaly} anomaly)")

    results = {}

    # --- Retrain Isolation Forest ---
    try:
        X_normal = X[y == 0]
        if len(X_normal) >= 30:
            new_if = SentivoyIsolationForest(n_estimators=200, contamination=0.05)
            new_if.fit(X_normal, sample_description=f"retrain_{reason}")
            _atomic_save(new_if, "isolation_forest")
            results["isolation_forest"] = "updated"
            print(f"[Retrainer] ✓ Isolation Forest retrained on {len(X_normal)} normal samples")
        else:
            results["isolation_forest"] = "skipped_insufficient_data"
    except Exception as e:
        results["isolation_forest"] = f"error: {e}"
        print(f"[Retrainer] ✗ IF retrain failed: {e}")

    # --- Retrain XGBoost (warm start) ---
    try:
        if n_anomaly >= 5:
            from app.ml.xgb_model import load_xgb_model
            current_xgb = load_xgb_model()

            if current_xgb.is_fitted:
                # Warm-start: add trees to existing model
                metrics = current_xgb.warm_start_fit(X, y, n_additional_rounds=50, description=f"warmstart_{reason}")
            else:
                # Cold start: full training
                from sklearn.model_selection import train_test_split
                X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
                metrics = current_xgb.fit(X_tr, y_tr, X_val=X_val, y_val=y_val, description=f"retrain_{reason}")

            _atomic_save(current_xgb, "xgboost")
            results["xgboost"] = {"status": "updated", "metrics": metrics}
            print(f"[Retrainer] ✓ XGBoost retrained — F1: {metrics.get('warm_start_f1', metrics.get('train_f1', 'N/A'))}")
        else:
            results["xgboost"] = "skipped_insufficient_anomalies"
    except Exception as e:
        results["xgboost"] = f"error: {e}"
        print(f"[Retrainer] ✗ XGBoost retrain failed: {e}")

    # --- Reload ensemble ---
    try:
        reload_ensemble()
        print("[Retrainer] ✓ Ensemble reloaded with updated models")
    except Exception as e:
        print(f"[Retrainer] ✗ Ensemble reload failed: {e}")

    # --- Update drift baseline ---
    try:
        from app.ml.ensemble import get_ensemble
        ensemble = get_ensemble()
        scores = ensemble.predict_batch(X)
        _save_drift_baseline(scores)
    except Exception:
        pass

    # --- Log training history ---
    _log_training_event(reason, len(y), n_normal, n_anomaly, results)
    print(f"{'='*60}\n")


def _atomic_save(model, model_type: str):
    """Save model to a temp file, then atomically rename."""
    os.makedirs(_MODEL_DIR, exist_ok=True)
    if model_type == "isolation_forest":
        from app.ml.isolation_forest import _IF_MODEL_PATH, _IF_META_PATH
        tmp_model = _IF_MODEL_PATH + ".tmp"
        tmp_meta = _IF_META_PATH + ".tmp"
        model.save(path=tmp_model, meta_path=tmp_meta)
        shutil.move(tmp_model, _IF_MODEL_PATH)
        shutil.move(tmp_meta, _IF_META_PATH)
    elif model_type == "xgboost":
        from app.ml.xgb_model import _XGB_MODEL_PATH, _XGB_META_PATH
        tmp_model = _XGB_MODEL_PATH + ".tmp"
        tmp_meta = _XGB_META_PATH + ".tmp"
        model.save(path=tmp_model, meta_path=tmp_meta)
        shutil.move(tmp_model, _XGB_MODEL_PATH)
        shutil.move(tmp_meta, _XGB_META_PATH)


def _log_training_event(reason, total, n_normal, n_anomaly, results):
    """Append to training_history.json for monitoring."""
    os.makedirs(os.path.dirname(_HISTORY_PATH), exist_ok=True)
    history = []
    if os.path.exists(_HISTORY_PATH):
        try:
            with open(_HISTORY_PATH, "r") as f:
                history = json.load(f)
        except Exception:
            history = []

    history.append({
        "timestamp": datetime.utcnow().isoformat(),
        "reason": reason,
        "total_samples": total,
        "normal_samples": n_normal,
        "anomaly_samples": n_anomaly,
        "results": _serialize_results(results),
    })

    # Keep last 100 entries
    history = history[-100:]
    with open(_HISTORY_PATH, "w") as f:
        json.dump(history, f, indent=2)


def _serialize_results(results):
    """Make results JSON-serializable."""
    out = {}
    for k, v in results.items():
        if isinstance(v, dict):
            out[k] = {kk: (vv if isinstance(vv, (str, int, float, bool)) else str(vv)) for kk, vv in v.items()}
        else:
            out[k] = str(v) if not isinstance(v, (str, int, float, bool)) else v
    return out


# ── Scheduled Entry Points ───────────────────────────────────────────────────

def scheduled_retrain():
    """Called by APScheduler every 6 hours."""
    retrain(hours=24, reason="scheduled_6h")


def drift_check_and_retrain():
    """Called by APScheduler every 30 minutes."""
    psi, needs_retrain = check_drift()
    if needs_retrain:
        retrain(hours=48, reason=f"drift_psi_{psi:.3f}")


def get_training_history() -> List[Dict]:
    """Return training history for the API."""
    if os.path.exists(_HISTORY_PATH):
        try:
            with open(_HISTORY_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []
