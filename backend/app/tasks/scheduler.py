"""
Background task scheduler — Multi-strategy retraining.

- Periodic retrain: Every 6 hours
- Drift check: Every 30 minutes
- Metrics snapshot: Every hour
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.ml.retrainer import scheduled_retrain, drift_check_and_retrain

scheduler = BackgroundScheduler()


def start_scheduler():
    """Initialize and start the multi-strategy background scheduler."""

    # 1. Full retrain every 6 hours using production feedback
    scheduler.add_job(
        scheduled_retrain,
        trigger=IntervalTrigger(hours=6),
        id="periodic_retrain_6h",
        name="Periodic Ensemble Retrain (6h)",
        replace_existing=True,
    )

    # 2. Drift detection every 30 minutes — triggers retrain if needed
    scheduler.add_job(
        drift_check_and_retrain,
        trigger=IntervalTrigger(minutes=30),
        id="drift_check_30m",
        name="Drift Detection Check (30m)",
        replace_existing=True,
    )

    scheduler.start()
    print("[Scheduler] Started multi-strategy retraining:")
    print("  → Periodic retrain: every 6 hours")
    print("  → Drift detection:  every 30 minutes")


def stop_scheduler():
    """Stop the background scheduler."""
    scheduler.shutdown()
    print("[Scheduler] Stopped background tasks.")
