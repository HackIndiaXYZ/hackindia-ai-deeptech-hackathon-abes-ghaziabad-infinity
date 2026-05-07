"""
MCP (Model Context Protocol) Client Services.
Production-grade integration layer that connects Sentivoy's Decision Engine
to external services using credentials stored per-tenant in the database.

Supported Providers:
  - Slack          (webhook-based alerting)
  - Discord        (webhook-based alerting)
  - PagerDuty      (incident creation via Events API v2)
  - GitHub         (context: recent commits / deployments)
  - Jira           (auto-create security tickets)
  - Linear         (auto-create security tickets)
  - Notion         (auto-create incident post-mortems)
  - Google Drive   (upload PDF reports)
"""

import httpx
import json
import base64
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.db.supabase_client import get_supabase


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_integration_config(tenant_id: str, provider: str) -> Optional[Dict[str, Any]]:
    """Fetch the active configuration for a specific provider."""
    supabase = get_supabase()
    try:
        res = supabase.table("integrations") \
            .select("config") \
            .eq("tenant_id", tenant_id) \
            .eq("provider", provider) \
            .eq("is_active", True) \
            .execute()

        if res.data:
            return res.data[0].get("config")
    except Exception as e:
        print(f"[MCP] Error fetching config for {provider}: {e}")
    return None


def _build_anomaly_summary(
    user_id: str,
    ip_address: str,
    event_type: str,
    severity: str,
    action: str,
    reasoning: str,
    score: float,
    timestamp: str,
) -> str:
    """Build a human-readable anomaly summary string."""
    return (
        f"🚨 *Sentivoy Security Alert*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"*Severity:* `{severity.upper()}`\n"
        f"*Action Taken:* `{action.upper()}`\n"
        f"*User:* `{user_id}`\n"
        f"*IP Address:* `{ip_address}`\n"
        f"*Event:* `{event_type}`\n"
        f"*Anomaly Score:* `{score:.4f}`\n"
        f"*Timestamp:* `{timestamp}`\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"*Reasoning:* {reasoning}"
    )


# ─── Slack ───────────────────────────────────────────────────────────────────

async def send_slack_alert(
    tenant_id: str,
    user_id: str,
    ip_address: str,
    event_type: str,
    severity: str,
    action: str,
    reasoning: str,
    score: float,
    timestamp: str,
) -> bool:
    """Send a rich alert to a connected Slack workspace via Incoming Webhook."""
    config = get_integration_config(tenant_id, "slack")
    if not config or "webhook_url" not in config:
        return False

    text = _build_anomaly_summary(
        user_id, ip_address, event_type, severity, action, reasoning, score, timestamp
    )

    payload = {
        "blocks": [
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": text},
            }
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(config["webhook_url"], json=payload, timeout=10.0)
            ok = r.status_code == 200
            print(f"[MCP Slack] {'✅ Sent' if ok else '❌ Failed'} alert for tenant {tenant_id}")
            return ok
    except Exception as e:
        print(f"[MCP Slack] Error: {e}")
        return False


# ─── Discord ─────────────────────────────────────────────────────────────────

async def send_discord_alert(
    tenant_id: str,
    user_id: str,
    ip_address: str,
    event_type: str,
    severity: str,
    action: str,
    reasoning: str,
    score: float,
    timestamp: str,
) -> bool:
    """Send a rich embed alert to a Discord channel via Webhook."""
    config = get_integration_config(tenant_id, "discord")
    if not config or "webhook_url" not in config:
        return False

    color_map = {"critical": 0xFF0000, "high": 0xFF6600, "medium": 0xFFCC00, "low": 0x00CC00}

    payload = {
        "embeds": [
            {
                "title": "🚨 Sentivoy Security Alert",
                "color": color_map.get(severity, 0xFFFFFF),
                "fields": [
                    {"name": "Severity", "value": f"`{severity.upper()}`", "inline": True},
                    {"name": "Action", "value": f"`{action.upper()}`", "inline": True},
                    {"name": "User", "value": f"`{user_id}`", "inline": True},
                    {"name": "IP Address", "value": f"`{ip_address}`", "inline": True},
                    {"name": "Event", "value": f"`{event_type}`", "inline": True},
                    {"name": "Score", "value": f"`{score:.4f}`", "inline": True},
                    {"name": "Reasoning", "value": reasoning, "inline": False},
                ],
                "timestamp": timestamp,
                "footer": {"text": "Sentivoy — AI Security Platform"},
            }
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(config["webhook_url"], json=payload, timeout=10.0)
            ok = r.status_code in (200, 204)
            print(f"[MCP Discord] {'✅ Sent' if ok else '❌ Failed'} alert for tenant {tenant_id}")
            return ok
    except Exception as e:
        print(f"[MCP Discord] Error: {e}")
        return False


# ─── PagerDuty ───────────────────────────────────────────────────────────────

async def trigger_pagerduty_incident(
    tenant_id: str,
    user_id: str,
    ip_address: str,
    event_type: str,
    severity: str,
    action: str,
    reasoning: str,
    score: float,
    timestamp: str,
) -> bool:
    """Create a PagerDuty incident via Events API v2."""
    config = get_integration_config(tenant_id, "pagerduty")
    if not config or "routing_key" not in config:
        return False

    pd_severity_map = {"critical": "critical", "high": "error", "medium": "warning", "low": "info"}

    payload = {
        "routing_key": config["routing_key"],
        "event_action": "trigger",
        "payload": {
            "summary": f"Sentivoy: {severity.upper()} anomaly from {user_id} @ {ip_address} — {reasoning}",
            "source": "sentivoy",
            "severity": pd_severity_map.get(severity, "info"),
            "timestamp": timestamp,
            "custom_details": {
                "user_id": user_id,
                "ip_address": ip_address,
                "event_type": event_type,
                "anomaly_score": score,
                "action_taken": action,
                "reasoning": reasoning,
            },
        },
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://events.pagerduty.com/v2/enqueue",
                json=payload,
                timeout=10.0,
            )
            ok = r.status_code == 202
            print(f"[MCP PagerDuty] {'✅ Triggered' if ok else '❌ Failed'} incident for tenant {tenant_id}")
            return ok
    except Exception as e:
        print(f"[MCP PagerDuty] Error: {e}")
        return False


# ─── GitHub ──────────────────────────────────────────────────────────────────

async def get_github_recent_activity(tenant_id: str) -> Optional[List[Dict]]:
    """
    Fetch recent commits from the user's configured GitHub repo
    to give the Decision Engine deployment context.
    """
    config = get_integration_config(tenant_id, "github")
    if not config or "access_token" not in config:
        return None

    token = config["access_token"]
    repo = config.get("repository", "")
    if not repo:
        return None

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://api.github.com/repos/{repo}/commits",
                headers=headers,
                params={"per_page": 5},
                timeout=10.0,
            )
            if r.status_code == 200:
                commits = r.json()
                return [
                    {
                        "sha": c["sha"][:7],
                        "message": c["commit"]["message"].split("\n")[0],
                        "author": c["commit"]["author"]["name"],
                        "date": c["commit"]["author"]["date"],
                    }
                    for c in commits
                ]
    except Exception as e:
        print(f"[MCP GitHub] Error: {e}")
    return None


# ─── Jira ────────────────────────────────────────────────────────────────────

async def create_jira_ticket(
    tenant_id: str,
    user_id: str,
    ip_address: str,
    event_type: str,
    severity: str,
    action: str,
    reasoning: str,
    score: float,
    timestamp: str,
) -> Optional[str]:
    """Create a Jira issue for the anomaly in the user's configured project."""
    config = get_integration_config(tenant_id, "jira")
    if not config:
        return None

    base_url = config.get("base_url", "").rstrip("/")
    email = config.get("email", "")
    api_token = config.get("api_token", "")
    project_key = config.get("project_key", "")

    if not all([base_url, email, api_token, project_key]):
        return None

    auth = base64.b64encode(f"{email}:{api_token}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    description = (
        f"h2. Sentivoy Security Alert\n\n"
        f"||Field||Value||\n"
        f"|Severity|{severity.upper()}|\n"
        f"|Action|{action.upper()}|\n"
        f"|User|{user_id}|\n"
        f"|IP Address|{ip_address}|\n"
        f"|Event Type|{event_type}|\n"
        f"|Anomaly Score|{score:.4f}|\n"
        f"|Timestamp|{timestamp}|\n\n"
        f"h3. Reasoning\n{reasoning}"
    )

    priority_map = {"critical": "Highest", "high": "High", "medium": "Medium", "low": "Low"}

    payload = {
        "fields": {
            "project": {"key": project_key},
            "summary": f"[Sentivoy] {severity.upper()} anomaly — {user_id} @ {ip_address}",
            "description": description,
            "issuetype": {"name": "Bug"},
            "priority": {"name": priority_map.get(severity, "Medium")},
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{base_url}/rest/api/2/issue",
                headers=headers,
                json=payload,
                timeout=15.0,
            )
            if r.status_code == 201:
                issue_key = r.json().get("key", "")
                print(f"[MCP Jira] ✅ Created ticket {issue_key} for tenant {tenant_id}")
                return issue_key
            else:
                print(f"[MCP Jira] ❌ Failed: {r.text}")
    except Exception as e:
        print(f"[MCP Jira] Error: {e}")
    return None


# ─── Linear ──────────────────────────────────────────────────────────────────

async def create_linear_ticket(
    tenant_id: str,
    user_id: str,
    ip_address: str,
    event_type: str,
    severity: str,
    action: str,
    reasoning: str,
    score: float,
    timestamp: str,
) -> Optional[str]:
    """Create a Linear issue via GraphQL API."""
    config = get_integration_config(tenant_id, "linear")
    if not config or "api_key" not in config or "team_id" not in config:
        return None

    priority_map = {"critical": 1, "high": 2, "medium": 3, "low": 4}

    description = (
        f"## Sentivoy Security Alert\n\n"
        f"| Field | Value |\n|---|---|\n"
        f"| Severity | `{severity.upper()}` |\n"
        f"| Action | `{action.upper()}` |\n"
        f"| User | `{user_id}` |\n"
        f"| IP | `{ip_address}` |\n"
        f"| Event | `{event_type}` |\n"
        f"| Score | `{score:.4f}` |\n"
        f"| Time | `{timestamp}` |\n\n"
        f"### Reasoning\n{reasoning}"
    )

    query = """
    mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
            success
            issue { id identifier title }
        }
    }
    """
    variables = {
        "input": {
            "teamId": config["team_id"],
            "title": f"[Sentivoy] {severity.upper()} anomaly — {user_id} @ {ip_address}",
            "description": description,
            "priority": priority_map.get(severity, 3),
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.linear.app/graphql",
                headers={
                    "Authorization": config["api_key"],
                    "Content-Type": "application/json",
                },
                json={"query": query, "variables": variables},
                timeout=15.0,
            )
            data = r.json()
            if data.get("data", {}).get("issueCreate", {}).get("success"):
                ident = data["data"]["issueCreate"]["issue"]["identifier"]
                print(f"[MCP Linear] ✅ Created {ident} for tenant {tenant_id}")
                return ident
            else:
                print(f"[MCP Linear] ❌ Failed: {data}")
    except Exception as e:
        print(f"[MCP Linear] Error: {e}")
    return None


# ─── Notion ──────────────────────────────────────────────────────────────────

async def create_notion_incident_page(
    tenant_id: str,
    user_id: str,
    ip_address: str,
    event_type: str,
    severity: str,
    action: str,
    reasoning: str,
    score: float,
    timestamp: str,
) -> Optional[str]:
    """Create an incident post-mortem page in a Notion database."""
    config = get_integration_config(tenant_id, "notion")
    if not config or "api_key" not in config or "database_id" not in config:
        return None

    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }

    payload = {
        "parent": {"database_id": config["database_id"]},
        "properties": {
            "Name": {"title": [{"text": {"content": f"Incident: {severity.upper()} — {user_id} @ {ip_address}"}}]},
            "Severity": {"select": {"name": severity.upper()}},
            "Status": {"select": {"name": "Open"}},
        },
        "children": [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": [{"text": {"content": "Incident Details"}}]},
            },
            {
                "object": "block",
                "type": "table",
                "table": {
                    "table_width": 2,
                    "has_column_header": True,
                    "children": [
                        {"table_row": {"cells": [[{"text": {"content": "Field"}}], [{"text": {"content": "Value"}}]]}},
                        {"table_row": {"cells": [[{"text": {"content": "User"}}], [{"text": {"content": user_id}}]]}},
                        {"table_row": {"cells": [[{"text": {"content": "IP"}}], [{"text": {"content": ip_address}}]]}},
                        {"table_row": {"cells": [[{"text": {"content": "Event"}}], [{"text": {"content": event_type}}]]}},
                        {"table_row": {"cells": [[{"text": {"content": "Score"}}], [{"text": {"content": f"{score:.4f}"}}]]}},
                        {"table_row": {"cells": [[{"text": {"content": "Action"}}], [{"text": {"content": action}}]]}},
                        {"table_row": {"cells": [[{"text": {"content": "Time"}}], [{"text": {"content": timestamp}}]]}},
                    ],
                },
            },
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": [{"text": {"content": "Reasoning"}}]},
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {"rich_text": [{"text": {"content": reasoning}}]},
            },
        ],
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.notion.com/v1/pages",
                headers=headers,
                json=payload,
                timeout=15.0,
            )
            if r.status_code == 200:
                page_id = r.json().get("id", "")
                print(f"[MCP Notion] ✅ Created incident page {page_id} for tenant {tenant_id}")
                return page_id
            else:
                print(f"[MCP Notion] ❌ Failed: {r.text}")
    except Exception as e:
        print(f"[MCP Notion] Error: {e}")
    return None


# ─── Google Drive ────────────────────────────────────────────────────────────

async def upload_to_google_drive(
    tenant_id: str,
    file_name: str,
    file_bytes: bytes,
    mime_type: str = "application/pdf",
) -> Optional[str]:
    """Upload a file (e.g. a PDF report) to the user's Google Drive folder."""
    config = get_integration_config(tenant_id, "google_drive")
    if not config or "access_token" not in config:
        return None

    folder_id = config.get("folder_id", "")

    metadata = {"name": file_name, "mimeType": mime_type}
    if folder_id:
        metadata["parents"] = [folder_id]

    # Multipart upload
    boundary = "sentivoy_boundary"
    body = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
        f"{json.dumps(metadata)}\r\n"
        f"--{boundary}\r\n"
        f"Content-Type: {mime_type}\r\n\r\n"
    ).encode() + file_bytes + f"\r\n--{boundary}--".encode()

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
                headers={
                    "Authorization": f"Bearer {config['access_token']}",
                    "Content-Type": f"multipart/related; boundary={boundary}",
                },
                content=body,
                timeout=30.0,
            )
            if r.status_code == 200:
                file_id = r.json().get("id", "")
                print(f"[MCP Google Drive] ✅ Uploaded {file_name} ({file_id}) for tenant {tenant_id}")
                return file_id
            else:
                print(f"[MCP Google Drive] ❌ Failed: {r.text}")
    except Exception as e:
        print(f"[MCP Google Drive] Error: {e}")
    return None


# ─── Orchestration: Fan-out alerts to all connected providers ────────────────

async def dispatch_alerts(
    tenant_id: str,
    user_id: str,
    ip_address: str,
    event_type: str,
    severity: str,
    action: str,
    reasoning: str,
    score: float,
    timestamp: str,
):
    """
    Fan-out: send the anomaly alert to every connected notification provider.
    Also auto-create tickets if Jira / Linear / Notion are connected.
    Called from the pipeline orchestrator after the Decision Engine runs.
    """
    kwargs = dict(
        tenant_id=tenant_id,
        user_id=user_id,
        ip_address=ip_address,
        event_type=event_type,
        severity=severity,
        action=action,
        reasoning=reasoning,
        score=score,
        timestamp=timestamp,
    )

    # ── Notification channels ────────────────────────────────────────────
    await send_slack_alert(**kwargs)
    await send_discord_alert(**kwargs)

    # ── Escalation (only critical/high) ──────────────────────────────────
    if severity in ("critical", "high"):
        await trigger_pagerduty_incident(**kwargs)

    # ── Ticketing (medium and above) ─────────────────────────────────────
    if severity in ("critical", "high", "medium"):
        await create_jira_ticket(**kwargs)
        await create_linear_ticket(**kwargs)

    # ── Documentation (critical only) ────────────────────────────────────
    if severity == "critical":
        await create_notion_incident_page(**kwargs)
