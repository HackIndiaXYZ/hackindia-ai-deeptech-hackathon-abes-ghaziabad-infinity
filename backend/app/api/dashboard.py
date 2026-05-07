"""
Dashboard Summary API Route.
Aggregates live data from the database to feed the frontend dashboard.
"""

from fastapi import APIRouter, Depends, HTTPException
from collections import defaultdict
from datetime import datetime, timedelta
import random
import httpx
from functools import lru_cache

from app.models.schemas import DashboardSummaryResponse, TrendPoint, ThreatPattern, GeoOrigin, AlertRow
from app.db.supabase_client import get_supabase
from app.core.security import verify_supabase_token


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# Cache local IP resolutions to memory to easily handle frequent dashboard reloads without hitting API limits
_geoip_cache = {}

async def resolve_ips_batch(ips: list[str]) -> dict:
    """Resolve a batch of IPs to coordinates using ip-api.com (free tier batch)."""
    # Filter out what we already have
    to_resolve = [ip for ip in ips if ip not in _geoip_cache and ip != "unknown"]
    
    # Simple hardcoded fallback for local/private IPs and preventing excessive API calls
    if to_resolve:
        # Keep chunk size reasonable (ip-api technically allows 100)
        chunks = [to_resolve[i:i+50] for i in range(0, len(to_resolve), 50)]
        for chunk in chunks:
            try:
                # Format: [{"query": "ip1"}, {"query": "ip2"}]
                payload = [{"query": ip, "fields": "status,country,countryCode,lat,lon"} for ip in chunk]
                async with httpx.AsyncClient() as client:
                    resp = await client.post("http://ip-api.com/batch", json=payload, timeout=5.0)
                    if resp.status_code == 200:
                        results = resp.json()
                        for i, r in enumerate(results):
                            if r.get("status") == "success":
                                _geoip_cache[chunk[i]] = (
                                    r.get("country", "Unknown"),
                                    r.get("countryCode", "--"),
                                    r.get("lon", 0.0),
                                    r.get("lat", 0.0)
                                )
                            else:
                                _geoip_cache[chunk[i]] = ("Reserved", "--", 0.0, 0.0)
            except Exception as e:
                print(f"Error fetching GeoIP: {e}")
                for ip in chunk:
                    _geoip_cache[ip] = ("Offline", "--", 0.0, 0.0)

    # Return mapping of requested IPs
    return {ip: _geoip_cache.get(ip, ("Unknown", "--", 0.0, 0.0)) for ip in ips}


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(user: dict = Depends(verify_supabase_token)):
    supabase = get_supabase()
    tenant_id = user.get("sub")
    
    if not tenant_id:
        raise HTTPException(status_code=401, detail="User ID missing from token")
        
    try:
        # Fetch all anomalies for the tenant
        anom_res = supabase.table("anomalies").select("*").eq("tenant_id", tenant_id).execute()
        anomalies_data = anom_res.data
        
        # Fetch all logs for the tenant
        # Note: In production with millions of logs, you would do a COUNT query.
        # Supabase python client supports count via .execute({count: "exact"})
        # But we also need the actual log details to join with anomalies.
        # We will fetch logs that have anomalies.
        log_ids = [a["log_id"] for a in anomalies_data]
        
        if log_ids:
            logs_res = supabase.table("logs").select("*").in_("id", log_ids).execute()
            logs_data = {log["id"]: log for log in logs_res.data}
        else:
            logs_data = {}
            
        # Also get total log count
        total_logs_res = supabase.table("logs").select("id", count="exact").eq("tenant_id", tenant_id).execute()
        total_logs = total_logs_res.count if total_logs_res.count is not None else 0

        # Metrics
        anomalies_count = len(anomalies_data)
        critical_count = sum(1 for a in anomalies_data if a["final_severity"] == "critical")
        threats_count = sum(1 for a in anomalies_data if a["is_anomaly"])
        blocked_count = sum(1 for a in anomalies_data if a["action_recommendation"] == "block")
        
        metrics = {
            "logs": total_logs,
            "anomalies": anomalies_count,
            "critical": critical_count,
            "threats": threats_count,
            "blocked": blocked_count
        }
        
        # Trend (last 48 half-hours)
        now = datetime.utcnow()
        trend_map = defaultdict(lambda: {"anomalies": 0, "critical": 0})
        
        for a in anomalies_data:
            # Join with log to get timestamp
            log = logs_data.get(a["log_id"])
            if log:
                # Parse timestamp
                ts_str = log["timestamp"].replace("Z", "+00:00")
                ts = datetime.fromisoformat(ts_str).replace(tzinfo=None)
                # Bucket by 30 min intervals
                minutes = ts.minute // 30 * 30
                bucket_time = ts.replace(minute=minutes, second=0, microsecond=0)
                time_label = bucket_time.strftime("%H:%M")
                
                trend_map[time_label]["anomalies"] += 1
                if a["final_severity"] == "critical":
                    trend_map[time_label]["critical"] += 1

        trend = []
        for i in range(47, -1, -1):
            bucket_time = now - timedelta(minutes=30 * i)
            time_label = bucket_time.strftime("%H:%M")
            trend.append(TrendPoint(
                time=time_label,
                anomalies=trend_map[time_label]["anomalies"],
                critical=trend_map[time_label]["critical"]
            ))

        # Threat Patterns
        event_counts = defaultdict(int)
        for a in anomalies_data:
            log = logs_data.get(a["log_id"])
            if log and a["is_anomaly"]:
                event_counts[log["event_type"]] += 1
                
        threat_patterns = [
            ThreatPattern(name=k.replace("_", " ").title(), value=v)
            for k, v in sorted(event_counts.items(), key=lambda item: item[1], reverse=True)
        ]
        # Pad with 0 if empty so chart doesn't crash
        if not threat_patterns:
            threat_patterns = [ThreatPattern(name="No threats yet", value=0)]

        # Geo Origins
        # Gather all required IPs
        ips_to_resolve = set()
        for a in anomalies_data:
            log = logs_data.get(a["log_id"])
            if log and a["is_anomaly"] and "ip_address" in log:
                ips_to_resolve.add(log["ip_address"])
                
        # Bulk resolve asynchronously
        ip_mapping = await resolve_ips_batch(list(ips_to_resolve))
        
        # Aggregate logic
        geo_nodes = {}
        for a in anomalies_data:
            log = logs_data.get(a["log_id"])
            if log and a["is_anomaly"] and "ip_address" in log:
                ip = log["ip_address"]
                country, code, lon, lat = ip_mapping.get(ip, ("Unknown", "--", 0.0, 0.0))
                
                # Combine identical location hits dynamically 
                key = f"{lat}:{lon}"
                if key not in geo_nodes:
                    geo_nodes[key] = {
                        "country": country,
                        "code": code,
                        "x": lon,  # react-simple-maps expects [longitude, latitude] where lon is x 
                        "y": lat,
                        "threats": 0
                    }
                geo_nodes[key]["threats"] += 1
                
        geo_origins = []
        for v in geo_nodes.values():
            if v["code"] != "--" and v["threats"] > 0:
                count = v["threats"]
                intensity = "critical" if count > 10 else "high" if count > 5 else "medium"
                geo_origins.append(GeoOrigin(
                    country=v["country"], code=v["code"], x=v["x"], y=v["y"], threats=count, intensity=intensity
                ))
        
        if not geo_origins:
            # Provide at least one empty node for the map
            geo_origins.append(GeoOrigin(country="Monitoring", code="--", x=0, y=0, threats=0, intensity="low"))

        # Alerts (Latest 10)
        alerts = []
        sorted_anomalies = sorted(anomalies_data, key=lambda a: a["id"], reverse=True)[:10]
        for a in sorted_anomalies:
            log = logs_data.get(a["log_id"])
            if log:
                ip = log.get("ip_address", "unknown")
                country, code, _, _ = ip_mapping.get(ip, ("Unknown", "--", 0.0, 0.0))
                alerts.append(AlertRow(
                    id=a["log_id"],
                    timestamp=log["timestamp"],
                    user=log["user_id"],
                    ip=log["ip_address"],
                    event=log["event_type"].replace("_", " ").title(),
                    severity=a["final_severity"].capitalize(),
                    status="Open" if a["action_recommendation"] in ["flag", "block"] else "Resolved",
                    country=code,
                    rawLog=f"[{log['timestamp']}] level=warn src_ip={log['ip_address']} user={log['user_id']} event={log['event_type']} action={a['action_recommendation']}"
                ))

        return DashboardSummaryResponse(
            metrics=metrics,
            trend=trend,
            threatPatterns=threat_patterns,
            geoOrigins=geo_origins,
            alerts=alerts
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard summary: {str(e)}")
