"""
Agent action for IP blocking.
Uses Cloudflare WAF if connected, otherwise logs the block locally
and stores it in the Supabase `blocked_ips` table for reference.
"""

import httpx
from app.db.supabase_client import get_supabase
from app.services.mcp_client import get_integration_config
from datetime import datetime


def block_ip(ip_address: str, tenant_id: str, reason: str):
    """
    Blocks the given IP address for a specific tenant.
    1. Stores the block record in Supabase.
    2. If Cloudflare is connected, pushes a firewall rule via the API.
    """
    supabase = get_supabase()

    # ── 1. Store the block record ────────────────────────────────────────
    try:
        supabase.table("blocked_ips").insert({
            "tenant_id": tenant_id,
            "ip_address": ip_address,
            "reason": reason,
            "blocked_at": datetime.utcnow().isoformat(),
        }).execute()
        print(f"🚨 [IP Blocker] Recorded block: {ip_address} for tenant {tenant_id}")
    except Exception as e:
        # Table may not exist yet — log and continue
        print(f"[IP Blocker] Could not store block record: {e}")

    # ── 2. Push to Cloudflare if connected ───────────────────────────────
    config = get_integration_config(tenant_id, "cloudflare")
    if config and config.get("api_token") and config.get("zone_id"):
        try:
            _push_cloudflare_block(config, ip_address, reason)
        except Exception as e:
            print(f"[IP Blocker] Cloudflare push failed: {e}")


def _push_cloudflare_block(config: dict, ip_address: str, reason: str):
    """Create a Cloudflare WAF firewall rule to block an IP."""
    zone_id = config["zone_id"]
    api_token = config["api_token"]

    # Cloudflare IP Access Rules API
    url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/firewall/access_rules/rules"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "mode": "block",
        "configuration": {"target": "ip", "value": ip_address},
        "notes": f"Sentivoy auto-block: {reason}",
    }

    with httpx.Client() as client:
        r = client.post(url, headers=headers, json=payload, timeout=10.0)
        if r.status_code == 200 and r.json().get("success"):
            print(f"✅ [IP Blocker] Cloudflare blocked {ip_address}")
        else:
            print(f"❌ [IP Blocker] Cloudflare response: {r.text}")
