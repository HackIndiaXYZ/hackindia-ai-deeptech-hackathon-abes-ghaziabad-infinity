"""
Pydantic schemas for log ingestion, feature vectors, and anomaly results.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────────────

class EventType(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    API_CALL = "api_call"
    FILE_ACCESS = "file_access"
    CONFIG_CHANGE = "config_change"
    DATA_EXPORT = "data_export"


class EventStatus(str, Enum):
    SUCCESS = "success"
    FAILURE = "failure"


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ActionRecommendation(str, Enum):
    IGNORE = "ignore"
    MONITOR = "monitor"
    FLAG = "flag"
    BLOCK = "block"


# ── Log Schemas ──────────────────────────────────────────────────────────────

class LogEntry(BaseModel):
    """Schema for incoming log payloads via POST /api/logs."""
    user_id: str = Field(..., min_length=1, max_length=128, description="Unique user identifier")
    ip_address: str = Field(..., min_length=7, max_length=45, description="IPv4 or IPv6 address")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp (UTC)")
    event_type: EventType = Field(..., description="Type of event")
    status: EventStatus = Field(..., description="Event outcome")
    metadata: Optional[dict] = Field(default=None, description="Optional additional context")
    user_role: str = Field(default="user", description="Role of the user (admin/user)")
    tenant_id: Optional[str] = Field(default=None, description="Customer ID injected by API key validation")


class LogResponse(BaseModel):
    """Response after log ingestion."""
    id: str
    message: str = "Log ingested successfully"
    processing: bool = True


# ── Feature Schemas ──────────────────────────────────────────────────────────

class FeatureVector(BaseModel):
    """Extracted behavioral features for a single log event."""
    log_id: str
    login_frequency: float = Field(default=0.0, description="Login events in last 1h")
    failed_login_ratio: float = Field(default=0.0, description="Failed/total logins in last 1h")
    time_gap: float = Field(default=0.0, description="Seconds since user's previous event")
    geo_distance: float = Field(default=0.0, description="Haversine km between current and prev IP")
    request_rate: float = Field(default=0.0, description="Events per minute in last 5 min")
    ip_change_flag: float = Field(default=0.0, description="1.0 if IP changed, 0.0 otherwise")

    def to_list(self) -> list[float]:
        """Convert to a flat list for model input."""
        return [
            self.login_frequency,
            self.failed_login_ratio,
            self.time_gap,
            self.geo_distance,
            self.request_rate,
            self.ip_change_flag,
        ]


# ── Anomaly Schemas ──────────────────────────────────────────────────────────

class AnomalyResult(BaseModel):
    """Output of the anomaly detection + agent decision pipeline."""
    log_id: str
    tenant_id: Optional[str] = None
    anomaly_score: float
    is_anomaly: bool
    severity: SeverityLevel
    # Agent decision fields
    final_severity: SeverityLevel
    action_recommendation: ActionRecommendation
    reasoning: str = ""

# ── API Key Schemas ──────────────────────────────────────────────────────────

class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name for the API key (e.g., 'Production')")

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_string: str
    created_at: str
    is_active: bool



class AnomalyQueryParams(BaseModel):
    """Query parameters for GET /api/anomalies."""
    limit: int = Field(default=50, ge=1, le=500)
    severity: Optional[SeverityLevel] = None
    user_id: Optional[str] = None

# ── Dashboard Schemas ────────────────────────────────────────────────────────

class TrendPoint(BaseModel):
    time: str
    anomalies: int
    critical: int

class ThreatPattern(BaseModel):
    name: str
    value: int

class GeoOrigin(BaseModel):
    country: str
    code: str
    x: float
    y: float
    threats: int
    intensity: str

class AlertRow(BaseModel):
    id: str
    timestamp: str
    user: str
    ip: str
    event: str
    severity: str
    status: str
    country: str
    rawLog: str

class DashboardSummaryResponse(BaseModel):
    metrics: dict
    trend: List[TrendPoint]
    threatPatterns: List[ThreatPattern]
    geoOrigins: List[GeoOrigin]
    alerts: List[AlertRow]


# ── Email / Notification Schemas ─────────────────────────────────────────────

class EmailAlertRequest(BaseModel):
    """Request to manually send an alert email."""
    email: Optional[str] = Field(default=None, description="Override recipient email")
    severity: SeverityLevel = Field(default=SeverityLevel.CRITICAL)
    message: Optional[str] = Field(default=None, description="Custom message")

class ReportRequest(BaseModel):
    """Request to generate a PDF report with optional filters."""
    days: int = Field(default=30, ge=1, le=365, description="Report period in days")
    include_recommendations: bool = Field(default=True)

class NotificationLog(BaseModel):
    """Record of a sent notification."""
    id: Optional[str] = None
    tenant_id: str
    email: str
    alert_type: str  # "critical_alert", "report", "test"
    status: str  # "sent", "failed"
    sent_at: Optional[str] = None


