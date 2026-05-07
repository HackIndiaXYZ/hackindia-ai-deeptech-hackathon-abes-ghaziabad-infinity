"""
Feature engineering module.
Extracts behavioral features from raw logs.
"""

import math
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.models.schemas import LogEntry, FeatureVector
from app.db.supabase_client import get_supabase


def mock_geo_lookup(ip: str) -> tuple[float, float]:
    """
    Mock an IP to Lat/Lng lookup by hashing the IP.
    Returns (latitude, longitude)
    """
    h = hashlib.md5(ip.encode()).hexdigest()
    # Use first 8 chars for lat, next 8 for lng
    lat_val = int(h[:8], 16)
    lng_val = int(h[8:16], 16)
    
    # Map to valid ranges: lat -90 to 90, lng -180 to 180
    lat = (lat_val / 0xFFFFFFFF) * 180 - 90
    lng = (lng_val / 0xFFFFFFFF) * 360 - 180
    return lat, lng


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points on earth in km."""
    R = 6371  # Earth radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def extract_features(log: LogEntry, log_id: str) -> FeatureVector:
    """
    Query historical data for this user and extract the 6 features.
    """
    supabase = get_supabase()
    
    # Time windows
    now = log.timestamp
    one_hour_ago = now - timedelta(hours=1)
    five_mins_ago = now - timedelta(minutes=5)
    
    # In production, we'd use a more optimized SQL RPC or aggregation,
    # but for this architecture we'll fetch the last hour of events for the user.
    # Note: supabase-py handles timestamp formats as ISO strings.
    one_hour_iso = one_hour_ago.isoformat()
    
    # We use `.execute()` in python supabase v2+
    try:
        response = supabase.table("logs").select("*").eq("user_id", log.user_id).gte("timestamp", one_hour_iso).order("timestamp", desc=True).execute()
        history = response.data
    except Exception as e:
        print(f"Warning: Failed to fetch history for feature extraction: {e}")
        history = []
        
    # Exclude the current log if it's already in the DB
    history = [h for h in history if h.get("id") != log_id]

    # Initialize features
    login_freq = 0.0
    failed_login_ratio = 0.0
    time_gap = 0.0
    geo_distance = 0.0
    req_rate = 0.0
    ip_change = 0.0
    
    if not history:
        # First time seeing this user recently
        time_gap = 1.0  # Max normalized value for a very long gap
        return FeatureVector(
            log_id=log_id,
            login_frequency=0.0,
            failed_login_ratio=0.0,
            time_gap=time_gap,
            geo_distance=0.0,
            request_rate=0.0,
            ip_change_flag=0.0
        )

    # 1. & 2. Login frequency & Failed ratio
    login_events = [h for h in history if h.get("event_type") == "login"]
    login_freq = len(login_events) / 10.0  # Normalize (assuming 10+ logins per hour is very high)
    
    if login_events:
        failed_logins = len([h for h in login_events if h.get("status") == "failure"])
        failed_login_ratio = failed_logins / len(login_events)
        
    # 3. Time gap (from most recent event)
    prev_event = history[0]
    prev_time_str = prev_event.get("timestamp")
    # Parse ISO (handle 'Z' or offset)
    if prev_time_str.endswith('Z'):
        prev_time_str = prev_time_str[:-1] + '+00:00'
    prev_time = datetime.fromisoformat(prev_time_str).replace(tzinfo=None)
    
    # Normalize gap (0 to 1, where 1 is 1 hour or more)
    gap_seconds = (now.replace(tzinfo=None) - prev_time).total_seconds()
    time_gap = min(gap_seconds / 3600.0, 1.0)
    
    # 4. Geo distance & 6. IP change
    prev_ip = prev_event.get("ip_address", "")
    if prev_ip and prev_ip != log.ip_address:
        ip_change = 1.0
        
        lat1, lng1 = mock_geo_lookup(prev_ip)
        lat2, lng2 = mock_geo_lookup(log.ip_address)
        
        dist_km = haversine_distance(lat1, lng1, lat2, lng2)
        # Normalize distance (0 to 1, where 1 is 10000km+)
        geo_distance = min(dist_km / 10000.0, 1.0)
        
    # 5. Request rate (last 5 mins)
    recent_events = [
        h for h in history 
        if (now.replace(tzinfo=None) - datetime.fromisoformat(h.get("timestamp").replace('Z', '+00:00')).replace(tzinfo=None)).total_seconds() <= 300
    ]
    # Events per minute (normalized, assuming 10+ req/min is high)
    req_rate = min((len(recent_events) / 5.0) / 10.0, 1.0)
    
    return FeatureVector(
        log_id=log_id,
        login_frequency=min(login_freq, 1.0),
        failed_login_ratio=failed_login_ratio,
        time_gap=time_gap,
        geo_distance=geo_distance,
        request_rate=req_rate,
        ip_change_flag=ip_change
    )
