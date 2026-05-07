"""
Simulation script to push synthetic logs to the backend.
Demonstrates normal behavior, brute force, geo-anomaly, and API abuse.
"""

import httpx
import time
import random
import uuid
from datetime import datetime, timedelta
import asyncio

API_URL = "http://127.0.0.1:8000/api/logs"
API_KEY = "sentivoy-dev-api-key-change-me"  # Must match backend .env

def generate_base_log(user_id: str, ip: str, event_type: str, status: str) -> dict:
    return {
        "user_id": user_id,
        "ip_address": ip,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event_type": event_type,
        "status": status,
        "user_role": "user"
    }

async def send_log(client: httpx.AsyncClient, log_data: dict):
    headers = {"X-API-Key": API_KEY}
    try:
        response = await client.post(API_URL, json=log_data, headers=headers)
        if response.status_code == 202:
            print(f"Sent {log_data['event_type']} for {log_data['user_id']} ({log_data['status']})")
        else:
            print(f"Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")


async def simulate_normal_traffic(client: httpx.AsyncClient):
    print("--- Simulating Normal Traffic ---")
    user = f"user_{random.randint(100, 999)}"
    ip = f"192.168.1.{random.randint(10, 250)}"
    
    # Login
    await send_log(client, generate_base_log(user, ip, "login", "success"))
    await asyncio.sleep(1)
    
    # API calls over time
    for _ in range(3):
        await send_log(client, generate_base_log(user, ip, "api_call", "success"))
        await asyncio.sleep(2)


async def simulate_brute_force(client: httpx.AsyncClient):
    print("--- Simulating Brute Force Attack ---")
    user = "target_admin"
    attacker_ip = "45.22.11.89"
    
    # Rapid failed logins
    for _ in range(8):
        log = generate_base_log(user, attacker_ip, "login", "failure")
        log["user_role"] = "admin"
        await send_log(client, log)
        await asyncio.sleep(0.1)  # Very fast


async def simulate_geo_anomaly(client: httpx.AsyncClient):
    print("--- Simulating Geo Anomaly (Impossible Travel) ---")
    user = "travel_user"
    
    # Login from NY
    ip_ny = "69.172.200.1"
    await send_log(client, generate_base_log(user, ip_ny, "login", "success"))
    
    await asyncio.sleep(2)
    
    # Login from Tokyo seconds later
    ip_tokyo = "202.214.194.20"
    await send_log(client, generate_base_log(user, ip_tokyo, "login", "success"))


async def simulate_api_abuse(client: httpx.AsyncClient):
    print("--- Simulating API Abuse ---")
    user = "scraper_bot"
    ip = "104.28.10.1"
    
    await send_log(client, generate_base_log(user, ip, "login", "success"))
    
    # Very rapid API calls
    for _ in range(20):
        await send_log(client, generate_base_log(user, ip, "api_call", "success"))
        await asyncio.sleep(0.05)


async def main():
    async with httpx.AsyncClient() as client:
        # Check if backend is up
        try:
            await client.get("http://127.0.0.1:8000/")
        except httpx.ConnectError:
            print("Backend is not running. Please start it with `uvicorn app.main:app --reload`")
            return
            
        await simulate_normal_traffic(client)
        await asyncio.sleep(3)
        
        await simulate_brute_force(client)
        await asyncio.sleep(3)
        
        await simulate_geo_anomaly(client)
        await asyncio.sleep(3)
        
        await simulate_api_abuse(client)
        
        print("\nSimulation complete. Check the Sentivoy dashboard or database for results.")

if __name__ == "__main__":
    asyncio.run(main())
