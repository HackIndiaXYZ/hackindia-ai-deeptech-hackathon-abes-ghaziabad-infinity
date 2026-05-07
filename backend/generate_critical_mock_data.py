import asyncio
import json
import uuid
import httpx
from datetime import datetime, timezone, timedelta

API_URL = "http://127.0.0.1:8000/api/logs"
API_KEY = "sentivoy-dev-api-key-change-me"  # Built-in dev bypass

# Real IP examples for geo-location simulation
US_IP_1 = "67.11.23.111"
US_IP_2 = "98.12.33.222"
RU_IP_1 = "46.17.43.12"
CN_IP_1 = "114.114.114.114"
BR_IP_1 = "177.43.11.22"

async def send_log(client: httpx.AsyncClient, log_data: dict, index: int, delay_sec: float = 0):
    if delay_sec > 0:
        await asyncio.sleep(delay_sec)
        
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        response = await client.post(API_URL, json=log_data, headers=headers)
        if response.status_code == 202:
            print(f"[{index:02d}] INGESTED: {log_data['event_type']} | User: {log_data['user_id']} | IP: {log_data['ip_address']} | Status: {log_data['status']}")
        else:
            print(f"[{index:02d}] FAILED: {response.status_code} -> {response.text}")
    except Exception as e:
        print(f"[{index:02d}] ERROR: {repr(e)}")

def create_log(user_id, ip, event_type, status, minutes_ago, role="user", metadata=None):
    return {
        "user_id": user_id,
        "ip_address": ip,
        "event_type": event_type,
        "status": status,
        "user_role": role,
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)).isoformat(),
        "metadata": metadata or {}
    }

async def main():
    print("*** Sentivoy Mock Data Generator for Judges Demo ***")
    print("-" * 50)
    
    logs = []
    
    # ── SCENARIO 1: Background Noise (Normal Behavior) ──
    print("Generating background noise...")
    for i in range(15):
        logs.append(create_log("jdoe", US_IP_1, "api_call", "success", 60 - i, "user", {"endpoint": "/api/v1/profile"}))
        logs.append(create_log("asmith", US_IP_2, "login", "success", 59 - i, "user", {"browser": "Chrome"}))
        
    # ── SCENARIO 2: Brute Force Attack -> Success ──
    print("Generating Brute Force Attack scenario...")
    for i in range(10):
        logs.append(create_log("admin_root", RU_IP_1, "login", "failure", 30 - (i * 0.1), "admin"))
    # Finally succeeds
    logs.append(create_log("admin_root", RU_IP_1, "login", "success", 28, "admin"))
    
    # ── SCENARIO 3: Impossible Travel (US -> China in 2 mins) ──
    print("Generating Impossible Travel scenario...")
    logs.append(create_log("ceo_billing", US_IP_1, "login", "success", 15, "admin"))
    logs.append(create_log("ceo_billing", CN_IP_1, "login", "success", 13, "admin"))
    
    # ── SCENARIO 4: Massive Data Exfiltration ──
    print("Generating Data Exfiltration scenario...")
    for i in range(8):
        logs.append(create_log("ceo_billing", CN_IP_1, "data_export", "success", 12 - (i * 0.2), "admin", {"size_mb": 500, "table": "customers"}))

    # ── SCENARIO 5: Privilege Escalation Attempt ──
    print("Generating Privilege Escalation scenario...")
    logs.append(create_log("guest_user", BR_IP_1, "api_call", "failure", 5, "user", {"endpoint": "/api/admin/settings"}))
    logs.append(create_log("guest_user", BR_IP_1, "api_call", "failure", 4.9, "user", {"endpoint": "/api/admin/users"}))
    logs.append(create_log("guest_user", BR_IP_1, "config_change", "success", 4.5, "admin", {"config": "firewall_rules"})) # Somehow succeeded!

    # Sort logs chronologically based on timestamp
    logs.sort(key=lambda x: x["timestamp"])

    print(f"\nSending {len(logs)} logs to pipeline sequentially...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        for i, log in enumerate(logs):
            await send_log(client, log, i, delay_sec=0.2)
        
    print("-" * 50)
    print("*** Mock data injection complete! Check the UI dashboard. ***")

if __name__ == "__main__":
    asyncio.run(main())
