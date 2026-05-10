import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Plus, X, ExternalLink, Shield } from "lucide-react";
import { useState, useEffect, type ComponentType, type SVGProps } from "react";
import { PageShell } from "@/components/sentinel/PageShell";
import { cn } from "@/lib/utils";
import { api, type IntegrationConfig } from "@/lib/api";
import {
  Slack,
  Discord,
  Pagerduty,
  Github,
  Jira,
  Linear,
  Notion,
  GoogleDrive,
  Cloudflare,
} from "@thesvg/react";

const BRAND_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  slack: Slack,
  discord: Discord,
  pagerduty: Pagerduty,
  github: Github,
  jira: Jira,
  linear: Linear,
  notion: Notion,
  google_drive: GoogleDrive,
  cloudflare: Cloudflare,
};

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Sentivoy" },
      { name: "description", content: "Connect SIEM, cloud, and identity sources." },
    ],
  }),
  component: IntegrationsPage,
});

interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  helpText?: string;
  helpUrl?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  fields?: ConfigField[];
}

interface ActiveIntegration {
  id: string;
  provider: string;
  is_active: boolean;
  config?: IntegrationConfig;
}

const STATIC_CATALOG: CatalogItem[] = [
  {
    id: "sentivoy",
    name: "Sentivoy Cloud Node",
    category: "Edge",
    color: "oklch(0.58 0.19 260)",
    description: "Built-in log processing engine.",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Notifications",
    color: "oklch(0.68 0.16 152)",
    description: "Send real-time alerts to any Slack channel.",
    fields: [
      {
        key: "webhook_url",
        label: "Webhook URL",
        placeholder: "https://hooks.slack.com/services/...",
        helpText: "Create an Incoming Webhook",
        helpUrl: "https://api.slack.com/messaging/webhooks",
      },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    category: "Notifications",
    color: "oklch(0.55 0.20 280)",
    description: "Post rich embed alerts to Discord channels.",
    fields: [
      {
        key: "webhook_url",
        label: "Webhook URL",
        placeholder: "https://discord.com/api/webhooks/...",
        helpText: "Server Settings → Integrations → Webhooks",
      },
    ],
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    category: "On-call",
    color: "oklch(0.68 0.16 152)",
    description: "Escalate critical incidents to on-call engineers.",
    fields: [
      {
        key: "routing_key",
        label: "Integration / Routing Key",
        placeholder: "e93facc04764012d7bfb002500d5d1a6",
        helpText: "Services → Service → Integrations → Events API v2",
        helpUrl: "https://support.pagerduty.com/docs/services-and-integrations",
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    category: "DevOps",
    color: "oklch(0.30 0.03 264)",
    description: "Pull recent commits for deployment context.",
    fields: [
      {
        key: "access_token",
        label: "Personal Access Token",
        placeholder: "ghp_...",
        type: "password",
        helpText: "Settings → Developer Settings → Tokens",
        helpUrl: "https://github.com/settings/tokens",
      },
      { key: "repository", label: "Repository (owner/repo)", placeholder: "Ayu-shhh19/Sentivoy" },
    ],
  },
  {
    id: "jira",
    name: "Jira",
    category: "Ticketing",
    color: "oklch(0.58 0.19 260)",
    description: "Auto-create security tickets in Jira.",
    fields: [
      { key: "base_url", label: "Jira Base URL", placeholder: "https://yourteam.atlassian.net" },
      { key: "email", label: "Account Email", placeholder: "you@company.com" },
      {
        key: "api_token",
        label: "API Token",
        placeholder: "ATATT3x...",
        type: "password",
        helpText: "Manage API Tokens",
        helpUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
      },
      { key: "project_key", label: "Project Key", placeholder: "SEC" },
    ],
  },
  {
    id: "linear",
    name: "Linear",
    category: "Ticketing",
    color: "oklch(0.55 0.17 280)",
    description: "Auto-create security issues in Linear.",
    fields: [
      {
        key: "api_key",
        label: "API Key",
        placeholder: "lin_api_...",
        type: "password",
        helpText: "Settings → API → Personal API Keys",
        helpUrl: "https://linear.app/settings/api",
      },
      { key: "team_id", label: "Team ID", placeholder: "abc123def456" },
    ],
  },
  {
    id: "notion",
    name: "Notion",
    category: "Knowledge Base",
    color: "oklch(0.35 0.02 264)",
    description: "Auto-generate incident post-mortems in Notion.",
    fields: [
      {
        key: "api_key",
        label: "Integration Token",
        placeholder: "secret_...",
        type: "password",
        helpText: "Create integration",
        helpUrl: "https://www.notion.so/my-integrations",
      },
      {
        key: "database_id",
        label: "Database ID",
        placeholder: "abc123...",
        helpText: "The ID from the database URL",
      },
    ],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    category: "Storage",
    color: "oklch(0.65 0.18 140)",
    description: "Upload PDF security reports to Drive.",
    fields: [
      {
        key: "access_token",
        label: "OAuth Access Token",
        placeholder: "ya29...",
        type: "password",
        helpText: "Use OAuth Playground to get a token",
        helpUrl: "https://developers.google.com/oauthplayground",
      },
      {
        key: "folder_id",
        label: "Folder ID (optional)",
        placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
      },
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "Edge / WAF",
    color: "oklch(0.78 0.15 78)",
    description: "Auto-block malicious IPs via Cloudflare firewall.",
    fields: [
      {
        key: "api_token",
        label: "API Token",
        placeholder: "v1.0-...",
        type: "password",
        helpText: "Create token with Zone.Firewall permissions",
        helpUrl: "https://dash.cloudflare.com/profile/api-tokens",
      },
      {
        key: "zone_id",
        label: "Zone ID",
        placeholder: "abc123...",
        helpText: "Found on the domain Overview page",
      },
    ],
  },
];

function IntegrationsPage() {
  const [activeIntegrations, setActiveIntegrations] = useState<ActiveIntegration[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CatalogItem | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const data = await api.integrations.list();
      setActiveIntegrations(data);
    } catch (e) {
      console.error("Failed to fetch integrations:", e);
    }
  };

  const handleConnectClick = (provider: CatalogItem) => {
    if (!provider.fields || provider.fields.length === 0) return;
    const existing = activeIntegrations.find((i) => i.provider === provider.id);
    setSelectedProvider(provider);

    const vals: Record<string, string> = {};
    for (const f of provider.fields) {
      vals[f.key] = existing?.config?.[f.key] || "";
    }
    setFieldValues(vals);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProvider) return;
    setIsLoading(true);
    try {
      await api.integrations.save(selectedProvider.id, fieldValues);
      await fetchIntegrations();
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedProvider) return;
    const existing = activeIntegrations.find((i) => i.provider === selectedProvider.id);
    if (!existing) return;

    setIsLoading(true);
    try {
      await api.integrations.disconnect(existing.id);
      await fetchIntegrations();
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to disconnect:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const integrationsList = STATIC_CATALOG.map((catalogItem) => {
    const isActive = activeIntegrations.some((i) => i.provider === catalogItem.id && i.is_active);
    return {
      ...catalogItem,
      connected: catalogItem.id === "sentivoy" ? true : isActive,
      events: isActive || catalogItem.id === "sentivoy" ? "Processing" : "Not connected",
    };
  });

  const connectedCount = integrationsList.filter((i) => i.connected).length;
  const hasFields = (item: CatalogItem) => item.fields && item.fields.length > 0;

  return (
    <PageShell
      title="Integrations"
      description={`${connectedCount} of ${integrationsList.length} sources connected.`}
      actions={
        <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition">
          <Plus className="h-3.5 w-3.5" /> Add source
        </button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {integrationsList.map((i) => (
          <div
            key={i.id}
            className="card-hover bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl grid place-items-center",
                  ["sentivoy", "github", "notion"].includes(i.id) ? "text-white" : "bg-muted/60",
                )}
                style={
                  ["sentivoy", "github", "notion"].includes(i.id)
                    ? { background: i.color }
                    : undefined
                }
              >
                {BRAND_ICONS[i.id] ? (
                  (() => {
                    const BrandIcon = BRAND_ICONS[i.id];
                    return (
                      <BrandIcon
                        className="h-5 w-5"
                        style={
                          ["sentivoy", "github", "notion"].includes(i.id)
                            ? { color: "white" }
                            : undefined
                        }
                      />
                    );
                  })()
                ) : (
                  <Shield
                    className={cn(
                      "h-5 w-5",
                      ["sentivoy", "github", "notion"].includes(i.id) ? "" : "text-primary",
                    )}
                  />
                )}
              </div>
              {i.connected ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-success/10 text-success">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              ) : (
                <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  Available
                </span>
              )}
            </div>
            <div className="mt-4 text-[14px] font-semibold text-foreground">{i.name}</div>
            <div className="text-[11px] text-muted-foreground">{i.category}</div>
            <div className="mt-1.5 text-[11.5px] text-muted-foreground leading-relaxed">
              {i.description}
            </div>
            <div className="mt-3 text-[12px] text-muted-foreground tabular-nums">{i.events}</div>
            <button
              onClick={() => handleConnectClick(i)}
              disabled={!hasFields(i)}
              className={cn(
                "mt-3 w-full h-8 rounded-lg text-[12px] font-semibold transition",
                i.connected
                  ? "border border-border hover:bg-muted text-foreground"
                  : "bg-foreground text-background hover:opacity-90",
                !hasFields(i) && "opacity-50 cursor-not-allowed",
              )}
            >
              {i.connected ? "Configure" : "Connect"}
            </button>
          </div>
        ))}
      </div>

      {/* ── Configuration Modal ────────────────────────────────────────── */}
      {isModalOpen && selectedProvider && selectedProvider.fields && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card border border-border w-[460px] max-h-[85vh] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-border">
              <div>
                <h3 className="font-semibold text-[15px]">Configure {selectedProvider.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedProvider.description}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Fields */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[50vh]">
              {selectedProvider.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-foreground">{field.label}</label>
                    {field.helpUrl && (
                      <a
                        href={field.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10.5px] text-primary hover:underline"
                      >
                        {field.helpText || "Docs"} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <input
                    type={field.type || "text"}
                    value={fieldValues[field.key] || ""}
                    onChange={(e) =>
                      setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  {field.helpText && !field.helpUrl && (
                    <p className="text-[10.5px] text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-muted/50 border-t border-border flex items-center justify-between">
              {activeIntegrations.some((i) => i.provider === selectedProvider.id) ? (
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="h-8 px-3 rounded-md text-[12px] font-medium text-destructive hover:bg-destructive/10 transition"
                >
                  Disconnect
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-[12px] font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[12px] font-medium transition disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
