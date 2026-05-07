"""
Initial Training Script — Trains both Isolation Forest and XGBoost
on synthetic data to bootstrap the ensemble.

Run: python -m app.ml.train
"""

import numpy as np
import os
from typing import Tuple
from sklearn.model_selection import train_test_split

from app.ml.isolation_forest import SentivoyIsolationForest
from app.ml.xgb_model import SentivoyXGBModel


def generate_synthetic_normal_data(num_samples: int = 10000) -> np.ndarray:
    """
    Generate synthetic feature vectors representing 'normal' user behavior.
    Features: login_freq, failed_login_ratio, time_gap, geo_distance, request_rate, ip_change_flag
    """
    np.random.seed(42)
    f0 = np.random.poisson(lam=1.0, size=num_samples).astype(np.float32) / 10.0
    f1 = np.random.choice([0.0, 0.1, 0.2], p=[0.9, 0.08, 0.02], size=num_samples).astype(np.float32)
    f2 = np.random.normal(loc=0.5, scale=0.2, size=num_samples).clip(0, 1).astype(np.float32)
    f3 = np.random.exponential(scale=0.05, size=num_samples).clip(0, 1).astype(np.float32)
    f4 = np.random.normal(loc=0.1, scale=0.05, size=num_samples).clip(0, 1).astype(np.float32)
    f5 = np.random.choice([0.0, 1.0], p=[0.95, 0.05], size=num_samples).astype(np.float32)
    return np.stack([f0, f1, f2, f3, f4, f5], axis=1)


def generate_synthetic_anomaly_data(num_samples: int = 1500) -> np.ndarray:
    """
    Generate realistic attack patterns:
    - Brute force (high failed_login_ratio)
    - Impossible travel (high geo_distance + ip_change)
    - Data exfiltration (high request_rate)
    - Credential stuffing (high login_freq + moderate failure)
    """
    np.random.seed(99)
    per_type = num_samples // 4

    # Brute force attacks
    brute = np.zeros((per_type, 6), dtype=np.float32)
    brute[:, 0] = np.random.uniform(0.5, 1.0, per_type)  # high login freq
    brute[:, 1] = np.random.uniform(0.6, 1.0, per_type)  # high failure ratio
    brute[:, 2] = np.random.uniform(0.0, 0.2, per_type)  # rapid succession
    brute[:, 3] = np.random.uniform(0.0, 0.3, per_type)  # same geo usually
    brute[:, 4] = np.random.uniform(0.3, 0.8, per_type)  # moderate request rate
    brute[:, 5] = np.random.choice([0.0, 1.0], p=[0.6, 0.4], size=per_type)

    # Impossible travel
    travel = np.zeros((per_type, 6), dtype=np.float32)
    travel[:, 0] = np.random.uniform(0.1, 0.4, per_type)
    travel[:, 1] = np.random.uniform(0.0, 0.3, per_type)
    travel[:, 2] = np.random.uniform(0.0, 0.15, per_type)  # short time gap
    travel[:, 3] = np.random.uniform(0.6, 1.0, per_type)  # huge geo distance
    travel[:, 4] = np.random.uniform(0.05, 0.3, per_type)
    travel[:, 5] = np.ones(per_type)  # always IP change

    # Data exfiltration
    exfil = np.zeros((per_type, 6), dtype=np.float32)
    exfil[:, 0] = np.random.uniform(0.0, 0.3, per_type)
    exfil[:, 1] = np.random.uniform(0.0, 0.1, per_type)
    exfil[:, 2] = np.random.uniform(0.0, 0.1, per_type)
    exfil[:, 3] = np.random.uniform(0.0, 0.2, per_type)
    exfil[:, 4] = np.random.uniform(0.6, 1.0, per_type)  # very high request rate
    exfil[:, 5] = np.random.choice([0.0, 1.0], p=[0.7, 0.3], size=per_type)

    # Credential stuffing
    cred = np.zeros((per_type, 6), dtype=np.float32)
    cred[:, 0] = np.random.uniform(0.6, 1.0, per_type)  # very high login freq
    cred[:, 1] = np.random.uniform(0.3, 0.7, per_type)  # moderate failure
    cred[:, 2] = np.random.uniform(0.0, 0.1, per_type)
    cred[:, 3] = np.random.uniform(0.0, 0.5, per_type)
    cred[:, 4] = np.random.uniform(0.3, 0.7, per_type)
    cred[:, 5] = np.random.choice([0.0, 1.0], p=[0.5, 0.5], size=per_type)

    return np.vstack([brute, travel, exfil, cred])


def train_all() -> Tuple[SentivoyIsolationForest, SentivoyXGBModel]:
    """Train both models and save to model_store/."""

    print("=" * 60)
    print("  Sentivoy ML — Initial Ensemble Training")
    print("=" * 60)

    # --- Generate Data ---
    print("\n[1/4] Generating synthetic data...")
    X_normal = generate_synthetic_normal_data(10000)
    X_anomaly = generate_synthetic_anomaly_data(1500)

    # --- Train Isolation Forest (unsupervised, normal data only) ---
    print("\n[2/4] Training Isolation Forest on normal data...")
    if_model = SentivoyIsolationForest(n_estimators=200, contamination=0.05)
    if_model.fit(X_normal, sample_description="initial_synthetic_normal")
    if_model.save()
    print(f"  ✓ Isolation Forest trained on {X_normal.shape[0]} normal samples")

    # --- Train XGBoost (supervised, labeled data) ---
    print("\n[3/4] Training XGBoost classifier on labeled data...")
    X_all = np.vstack([X_normal, X_anomaly])
    y_all = np.concatenate([np.zeros(len(X_normal)), np.ones(len(X_anomaly))])

    X_train, X_val, y_train, y_val = train_test_split(
        X_all, y_all, test_size=0.2, stratify=y_all, random_state=42
    )

    xgb_model = SentivoyXGBModel()
    metrics = xgb_model.fit(X_train, y_train, X_val=X_val, y_val=y_val, description="initial_synthetic")
    xgb_model.save()

    print(f"  ✓ XGBoost trained on {X_train.shape[0]} samples ({int(y_train.sum())} anomalies)")
    print(f"  Train — Accuracy: {metrics.get('train_accuracy', 0):.4f}, F1: {metrics.get('train_f1', 0):.4f}")
    if 'val_accuracy' in metrics:
        print(f"  Val   — Accuracy: {metrics.get('val_accuracy', 0):.4f}, F1: {metrics.get('val_f1', 0):.4f}")

    # --- Feature Importance ---
    print("\n[4/4] Feature Importance:")
    for name, imp in xgb_model.get_feature_importance().items():
        bar = "█" * int(imp * 40)
        print(f"  {name:25s} {imp:.4f} {bar}")

    print("\n" + "=" * 60)
    print("  Training complete! Models saved to model_store/")
    print("=" * 60)

    return if_model, xgb_model


if __name__ == "__main__":
    train_all()
