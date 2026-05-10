<p align="center">
  <img src="./logo.png" alt="Sentivoy Logo" width="120" />
</p>

<h1 align="center">Sentivoy — Frontend</h1>

<p align="center">
  <strong>AI-Powered Cybersecurity Command Center for Log Anomaly Detection, Threat Analytics & Incident Response</strong>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=black" />
  <img alt="TanStack" src="https://img.shields.io/badge/TanStack_Start-1.167-ff4154?logo=react-router" />
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS-4.2-06b6d4?logo=tailwindcss&logoColor=white" />
  <img alt="Vite 7" src="https://img.shields.io/badge/Vite-7.3-646cff?logo=vite&logoColor=white" />
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Deploy-Cloudflare_Workers-f38020?logo=cloudflare&logoColor=white" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Component Architecture](#component-architecture)
  - [Sentinel Components (Domain-specific)](#sentinel-components-domain-specific)
  - [UI Components (shadcn/ui)](#ui-components-shadcnui)
- [Design System](#design-system)
- [State Management & Data Flow](#state-management--data-flow)
- [World Map & API Keys](#world-map--api-keys)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Key Dependencies](#key-dependencies)
- [License](#license)

---

## Overview

**Sentivoy** is a security operations platform that ingests and analyzes server, application, and network logs in real time to **detect, predict, and respond** to suspicious activities using **unsupervised machine learning** and **behavioral intelligence**.

This repository contains the **frontend** — a full-featured security command center dashboard built with **TanStack Start** (the full-stack framework powered by TanStack Router) on top of **React 19**, **Vite 7**, and **Tailwind CSS 4**. It is designed for deployment to **Cloudflare Workers** via the official Cloudflare Vite plugin.

### What the Dashboard Covers

| Capability                         | Description                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Security Overview**              | Real-time KPIs — total logs processed, anomalies detected, critical alerts, active threats, blocked IPs |
| **Anomaly Trend Visualization**    | Time-series area charts (24h / 7d / 30d) showing anomaly & critical event volumes                       |
| **Threat Patterns**                | Horizontal bar charts ranking the most active attack types (Brute Force, API Abuse, Geo Jump, etc.)     |
| **Geo Threat Intelligence**        | SVG world map with animated pulsing hotspots showing geographic threat origins                          |
| **AI-Powered Insights**            | "Sentinel AI" panel delivering real-time, contextual insight summaries with one-click response actions  |
| **MITRE ATT&CK Coverage**          | Radar chart + technique table mapping detected techniques to the MITRE framework                        |
| **Live Log Streaming**             | Terminal-style real-time log viewer with level filtering, search, pause/resume, and clear               |
| **Alert Triage Workflow**          | Filterable alert table with severity badges, status tabs, and slide-out drawer for deep drill-down      |
| **User Behavior Analytics (UEBA)** | Per-user risk scores, baseline deviation, geo-travel detection, and anomalous entity ranking            |
| **Incident Response**              | Active incidents with progress tracking, severity + status badges, and automated playbook execution     |
| **Integrations Hub**               | Connect/configure external data sources (AWS CloudTrail, Okta, GitHub Audit, Datadog, Splunk, etc.)     |
| **Settings**                       | Detection rules, notifications, team management, API key management, data retention policies            |

---

## Tech Stack

| Layer                 | Technology                                         | Version     |
| --------------------- | -------------------------------------------------- | ----------- |
| **Language**          | TypeScript                                         | 5.9         |
| **UI Library**        | React                                              | 19.2        |
| **Framework**         | TanStack Start (TanStack Router + React Query)     | 1.167+      |
| **Router**            | TanStack Router (file-based routing)               | 1.168       |
| **Server State**      | TanStack React Query                               | 5.99        |
| **Build Tool**        | Vite                                               | 7.3         |
| **CSS**               | Tailwind CSS 4 (with `@tailwindcss/vite`)          | 4.2         |
| **Component Library** | shadcn/ui (New York style)                         | —           |
| **Charting**          | Recharts                                           | 3.8         |
| **Animations**        | Framer Motion                                      | 12.38       |
| **Icons**             | Lucide React                                       | 0.575       |
| **Form Handling**     | React Hook Form + Zod + @hookform/resolvers        | 7.72 / 3.25 |
| **Deployment**        | Cloudflare Workers (via `@cloudflare/vite-plugin`) | —           |
| **Package Manager**   | Bun                                                | 1.3+        |
| **Linting**           | ESLint 9 (flat config) + Prettier                  | —           |

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── sentinel/          # 12 domain-specific components
│   │   │   ├── AIInsights.tsx
│   │   │   ├── AlertDrawer.tsx
│   │   │   ├── AlertsTable.tsx
│   │   │   ├── AnomalyTrend.tsx
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── ComingSoon.tsx
│   │   │   ├── GeoThreatMap.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── PageShell.tsx
│   │   │   ├── RepeatAttackRate.tsx
│   │   │   ├── ThreatPatterns.tsx
│   │   │   └── TopHeader.tsx
│   │   └── ui/                # 45 shadcn/ui primitives
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── ... (45 total)
│   │       └── tooltip.tsx
│   ├── hooks/
│   │   └── use-mobile.tsx     # Responsive breakpoint hook
│   ├── lib/
│   │   ├── mockData.ts        # Mock data generators & types
│   │   └── utils.ts           # `cn()` utility (clsx + tailwind-merge)
│   ├── routes/
│   │   ├── __root.tsx         # Root layout (HTML shell, meta tags, 404)
│   │   ├── index.tsx          # `/`  — Security Overview Dashboard
│   │   ├── threat-analytics.tsx # `/threat-analytics` — MITRE & Kill Chain
│   │   ├── live-logs.tsx      # `/live-logs` — Real-time log stream
│   │   ├── alerts.tsx         # `/alerts` — Alert triage workflow
│   │   ├── ueba.tsx           # `/ueba` — User Behavior Analytics
│   │   ├── geo.tsx            # `/geo` — Geo Intelligence
│   │   ├── incident-response.tsx # `/incident-response` — Playbooks & incidents
│   │   ├── integrations.tsx   # `/integrations` — Data source connectors
│   │   └── settings.tsx       # `/settings` — Workspace configuration
│   ├── router.tsx             # TanStack Router factory + error boundary
│   ├── routeTree.gen.ts       # Auto-generated route tree (DO NOT EDIT)
│   └── styles.css             # Global design tokens + Tailwind config
├── components.json            # shadcn/ui configuration
├── bunfig.toml                # Bun configuration
├── eslint.config.js           # ESLint 9 flat config
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite config (via @lovable.dev/vite-tanstack-config)
├── wrangler.jsonc             # Cloudflare Workers deployment config
└── logo.png                   # Sentivoy logo
```

---

## Pages & Routes

The application uses **TanStack Router's file-based routing**. Each file in `src/routes/` maps to a URL path. Routes are auto-generated into `routeTree.gen.ts`.

| Route                | Page                     | Description                                                                                                                                                                                                 |
| -------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | **Security Overview**    | Main dashboard with 5 KPI metric cards, anomaly trend chart, threat patterns bar chart, geo threat map, AI insights panel, alerts table, and repeat-attack-rate gauge                                       |
| `/threat-analytics`  | **Threat Analytics**     | 4 KPIs (Threat Score, MITRE techniques, detected campaigns, MTTD), radar chart for attack surface coverage, MITRE ATT&CK technique table, 30-day threat velocity area chart, and Cyber Kill Chain bar chart |
| `/live-logs`         | **Live Logs**            | Simulated real-time log stream with pause/resume, search filtering, level filtering (info/warn/error/critical), dark terminal-style UI, and auto-scroll                                                     |
| `/alerts`            | **Alerts**               | Severity overview cards (Critical/High/Medium/Low), tab-based status filtering (All/Open/Investigating/Resolved), full alerts table with slide-out detail drawer                                            |
| `/ueba`              | **User Behavior (UEBA)** | 4 KPIs (Monitored Users, Anomalous, Avg Risk Score, New Baselines), high-risk entity table with risk score progress bars, baseline deviation %, geo-travel, and behavioral status                           |
| `/geo`               | **Geo Intelligence**     | Full geo threat map, country breakdown sidebar, and ASN reputation table with autonomous system threat rankings                                                                                             |
| `/incident-response` | **Incident Response**    | 4 KPIs (Active Incidents, MTTR, On-call, Closed), open incidents list with resolution progress bars, and automated playbook catalog with one-click execution                                                |
| `/integrations`      | **Integrations**         | Grid of 12 data source cards (AWS CloudTrail, Okta, GitHub Audit, Datadog, Slack, PagerDuty, Google Workspace, Azure AD, Splunk, Crowdstrike, Cloudflare, Jira) with connect/configure actions              |
| `/settings`          | **Settings**             | Sidebar navigation with 6 sections (General, Detection Rules, Notifications, Team, API Keys, Data Retention), toggle-based configuration, API key management, and workspace overview                        |

### Root Layout (`__root.tsx`)

- Provides the HTML shell (`<html>`, `<head>`, `<body>`)
- Injects global meta tags (charset, viewport, OG tags)
- Loads the global stylesheet
- Provides a custom 404 Not Found page
- Each route provides its own `head()` for SEO-specific `<title>` and `<meta>` tags

---

## Component Architecture

### Sentinel Components (Domain-specific)

These are the 12 custom components in `src/components/sentinel/` that form the core UI of the security platform:

| Component          | File                   | Purpose                                                                                                                                                                                                     |
| ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppSidebar`       | `AppSidebar.tsx`       | Left navigation sidebar with 9 nav items, active-state highlighting, alert badge, upgrade CTA card, and help link. Hidden on mobile (`< lg` breakpoint).                                                    |
| `TopHeader`        | `TopHeader.tsx`        | Sticky top bar with global search (`⌘K`), time range selector (24h/7d/30d/Custom), live monitoring status badge, notification bell with unread indicator, and user profile dropdown.                        |
| `PageShell`        | `PageShell.tsx`        | Reusable page layout wrapper that composes `AppSidebar` + `TopHeader` + content area with title, description, and optional action buttons. Used by all routes except the dashboard.                         |
| `MetricCard`       | `MetricCard.tsx`       | Animated KPI card with count-up animation (via `requestAnimationFrame`), directional delta badge (↑/↓), severity-aware tone (default/critical/warning/success), and Framer Motion entrance animation.       |
| `AnomalyTrend`     | `AnomalyTrend.tsx`     | Time-series area chart (Recharts) with two data series (anomalies + critical), gradient fills, tab switcher for 24h/7d/30d, and responsive container.                                                       |
| `ThreatPatterns`   | `ThreatPatterns.tsx`   | Horizontal bar chart (Recharts) ranking top 5 threat types with distinct color-coded bars.                                                                                                                  |
| `GeoThreatMap`     | `GeoThreatMap.tsx`     | **SVG-based world map** with abstract continent silhouettes, animated pulsing threat origin dots (color-coded by intensity), and a "Top Origins" sidebar showing country, code, and threat count.           |
| `AIInsights`       | `AIInsights.tsx`       | AI assistant panel with glassmorphic background blur, contextual anomaly insight card, one-click action buttons (Force MFA, Investigate), event feed, and a chat input prompt for "Ask Sentinel AI".        |
| `RepeatAttackRate` | `RepeatAttackRate.tsx` | SVG donut/ring gauge with animated stroke dashoffset (Framer Motion), gradient coloring, and centered percentage label. Shows the rate of re-attempted attacks within 24h.                                  |
| `AlertsTable`      | `AlertsTable.tsx`      | Full-featured data table displaying alerts with timestamp (relative time), user/IP, event type, severity badge, status badge, and row-click interaction. Critical rows get a left-border accent.            |
| `AlertDrawer`      | `AlertDrawer.tsx`      | Slide-out sheet (uses shadcn/ui `Sheet`) for alert deep-dive: severity badge, event details grid (user, IP, country, status, timestamp), raw log display, related events timeline, and recommended actions. |
| `ComingSoon`       | `ComingSoon.tsx`       | Placeholder component for in-development modules.                                                                                                                                                           |

### UI Components (shadcn/ui)

The project includes **45 shadcn/ui primitive components** in `src/components/ui/`, configured with the **"New York" style variant** and **Tailwind CSS variables**. These are Radix UI-based headless components wrapped with Tailwind styling.

Key primitives used across the app include: `Sheet`, `Sidebar`, `Button`, `Card`, `Dialog`, `Tooltip`, `Dropdown Menu`, `Tabs`, and more.

---

## Design System

The design system is defined in `src/styles.css` using **CSS custom properties** (OKLCH color space) with full **light and dark mode** support.

### Color Palette

| Token                          | Light Mode               | Purpose                                              |
| ------------------------------ | ------------------------ | ---------------------------------------------------- |
| `--primary`                    | `oklch(0.58 0.19 260)`   | Security blue accent — buttons, links, active states |
| `--primary-soft`               | `oklch(0.96 0.03 260)`   | Subtle blue background for badges, highlights        |
| `--destructive` / `--critical` | `oklch(0.62 0.22 27)`    | Red — critical alerts, security threats              |
| `--success`                    | `oklch(0.68 0.16 152)`   | Green — resolved, healthy, positive indicators       |
| `--warning`                    | `oklch(0.78 0.15 78)`    | Amber — elevated risk, watch-list items              |
| `--background`                 | `oklch(0.978 0.003 247)` | Off-white app background                             |
| `--card`                       | `oklch(1 0 0)`           | Pure white card surfaces                             |
| `--border`                     | `oklch(0.93 0.01 255)`   | Subtle gray borders                                  |

### Typography & Shape

- Font features: `cv02`, `cv03`, `cv04`, `cv11` (OpenType)
- Anti-aliased rendering (`-webkit-font-smoothing: antialiased`)
- Border radius base: `1rem` with computed variants (`sm` through `4xl`)
- Custom shadows: `--shadow-soft`, `--shadow-card`, `--shadow-glow-critical`

### Custom Utilities

| Class             | Purpose                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| `.live-dot`       | Animated pulsing green dot (used for "Monitoring" and "Streaming" indicators) |
| `.card-hover`     | Subtle lift + shadow on hover for interactive cards                           |
| `.critical-glow`  | Red glow shadow for critical severity highlights                              |
| `.scrollbar-thin` | Thin custom scrollbar for WebKit browsers                                     |

---

## State Management & Data Flow

### Current State (Mock Data)

The frontend currently operates with **client-side mock data** for demonstration purposes:

- **`src/lib/mockData.ts`** provides all synthetic data:
  - `generateAlerts(n)` — generates `n` alert rows with random severity, status, IP, user, country, etc.
  - `generateTrend(points)` — generates time-series anomaly data for charts.
  - `threatPatterns` — static array of top threat types with counts.
  - `geoOrigins` — static array of 8 geographic threat origins with coordinates.

- **Live simulation** is achieved via `setInterval` in dashboard components:
  - KPI metrics update every 4 seconds with random deltas.
  - Live Logs page appends a new log line every 700ms.

### State Patterns

| Pattern                     | Usage                                                                          |
| --------------------------- | ------------------------------------------------------------------------------ |
| `useState`                  | Local component state for UI controls (tabs, filters, toggles, selected items) |
| `useMemo`                   | Expensive computations (alert generation, trend data)                          |
| `useEffect` + `setInterval` | Simulated real-time data updates                                               |
| `useRef`                    | DOM refs for auto-scrolling the live log terminal                              |
| Framer Motion               | Entry animations (`initial` → `animate`) and SVG stroke animations             |
| Custom `useCountUp` hook    | Animated number counting in `MetricCard` using `requestAnimationFrame`         |
| `useIsMobile` hook          | Responsive breakpoint detection at 768px                                       |

### Backend Integration Points

When connecting to a real backend, the following data sources would need API integration:

| Data Source                 | Components Consuming                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| Log ingestion metrics       | `MetricCard` (Total Logs, Anomalies, Critical, Threats, Blocked IPs) |
| Anomaly time-series         | `AnomalyTrend`                                                       |
| Threat pattern aggregations | `ThreatPatterns`                                                     |
| Geo-IP intelligence         | `GeoThreatMap`, Geo page                                             |
| Alert events                | `AlertsTable`, `AlertDrawer`, Alerts page                            |
| User behavior baselines     | UEBA page                                                            |
| Live log stream (WebSocket) | Live Logs page                                                       |
| Incident records            | Incident Response page                                               |
| Integration statuses        | Integrations page                                                    |
| Workspace settings          | Settings page                                                        |

---

## World Map & API Keys

### 🔑 No API Keys Required for the World Map

The world map displayed on the dashboard (`GeoThreatMap` component) and the `/geo` page **does NOT use any third-party mapping service** and therefore **requires zero API keys**.

Here is exactly how it works:

The `GeoThreatMap` component (located at `src/components/sentinel/GeoThreatMap.tsx`) renders a **fully custom SVG-based map** with:

1. **A dot-pattern background** using an SVG `<pattern>` element
2. **Abstract continent silhouettes** drawn as `<path>` elements directly in the SVG (not a real geographic projection — they are stylized, simplified blob shapes for North America, South America, Europe, Africa, Asia, and Oceania)
3. **Animated threat origin dots** positioned using hardcoded `(x, y)` coordinates on a `1000×500` viewBox (equirectangular approximation), with:
   - Pulsing animation via SVG `<animate>` elements
   - Color coding by intensity (critical = red, high = orange, medium = amber, low = blue)
   - Size scaled by threat count

**Data source:** The coordinates and threat data come from `src/lib/mockData.ts`:

```typescript
export const geoOrigins: GeoOrigin[] = [
  { country: "Russia", code: "RU", x: 660, y: 130, threats: 1284, intensity: "critical" },
  { country: "China", code: "CN", x: 760, y: 200, threats: 962, intensity: "critical" },
  { country: "Brazil", code: "BR", x: 360, y: 320, threats: 487, intensity: "high" },
  // ... more origins
];
```

### What If You Want a Real Map?

If you decide to upgrade to a real geographic map, here are the common options and their API key requirements:

| Library / Service                     | API Key Required?                    | Key Name / Env Var         |
| ------------------------------------- | ------------------------------------ | -------------------------- |
| **Mapbox GL JS**                      | ✅ Yes                               | `VITE_MAPBOX_ACCESS_TOKEN` |
| **Google Maps JavaScript API**        | ✅ Yes                               | `VITE_GOOGLE_MAPS_API_KEY` |
| **Leaflet + OpenStreetMap**           | ❌ No (OSM tiles are free)           | —                          |
| **Leaflet + Mapbox Tiles**            | ✅ Yes                               | `VITE_MAPBOX_ACCESS_TOKEN` |
| **react-simple-maps** (Natural Earth) | ❌ No                                | —                          |
| **D3.js + TopoJSON**                  | ❌ No                                | —                          |
| **Deck.gl**                           | ❌ No (unless using Mapbox base map) | —                          |

> **Recommendation:** For a security dashboard, [`react-simple-maps`](https://www.react-simple-maps.io/) or **D3.js + TopoJSON** would be excellent choices — they provide real geographic accuracy with no API key, no rate limits, and full offline capability.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 or **Bun** ≥ 1.3
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/Ayu-shhh19/Sentivoy.git
cd Sentivoy/frontend

# Install dependencies (using Bun — recommended)
bun install

# Or with npm
npm install
```

### Development

```bash
# Start the dev server
bun run dev

# The app will be available at http://localhost:5173 (or the port Vite assigns)
```

### Build

```bash
# Production build
bun run build

# Preview the production build
bun run preview
```

---

## Scripts

| Script      | Command                         | Purpose                                 |
| ----------- | ------------------------------- | --------------------------------------- |
| `dev`       | `vite dev`                      | Start development server with HMR       |
| `build`     | `vite build`                    | Production build for Cloudflare Workers |
| `build:dev` | `vite build --mode development` | Development build (unminified)          |
| `preview`   | `vite preview`                  | Preview the production build locally    |
| `lint`      | `eslint .`                      | Run ESLint across the project           |
| `format`    | `prettier --write .`            | Format all files with Prettier          |

---

## Deployment

The project is configured for **Cloudflare Workers** deployment via `wrangler.jsonc`:

```jsonc
{
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
}
```

### Deploy to Cloudflare

```bash
# Login to Cloudflare
npx wrangler login

# Deploy
npx wrangler deploy
```

The Vite config (via `@lovable.dev/vite-tanstack-config`) automatically includes the `@cloudflare/vite-plugin` for production builds, so the build output is directly compatible with Cloudflare Workers.

---

## Key Dependencies

### Runtime

| Package                    | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `@tanstack/react-router`   | Type-safe file-based routing                  |
| `@tanstack/react-start`    | Full-stack framework (SSR + server functions) |
| `@tanstack/react-query`    | Server state management & caching             |
| `recharts`                 | Charts (Area, Bar, Radar, Polar)              |
| `framer-motion`            | Animations & transitions                      |
| `lucide-react`             | Icon library (500+ icons)                     |
| `@radix-ui/*`              | Headless UI primitives (22 packages)          |
| `class-variance-authority` | Type-safe component variant styling           |
| `clsx` + `tailwind-merge`  | Conditional class name composition            |
| `zod`                      | Schema validation                             |
| `react-hook-form`          | Form state management                         |
| `sonner`                   | Toast notifications                           |
| `vaul`                     | Drawer component                              |
| `cmdk`                     | Command palette                               |
| `date-fns`                 | Date utilities                                |
| `embla-carousel-react`     | Carousel component                            |
| `react-resizable-panels`   | Resizable layout panels                       |
| `react-day-picker`         | Date picker                                   |
| `input-otp`                | OTP input component                           |

### Development

| Package                             | Purpose                                      |
| ----------------------------------- | -------------------------------------------- |
| `@lovable.dev/vite-tanstack-config` | Pre-configured Vite setup for TanStack Start |
| `@cloudflare/vite-plugin`           | Cloudflare Workers build integration         |
| `@vitejs/plugin-react`              | React Fast Refresh & JSX transform           |
| `typescript`                        | Type checking                                |
| `eslint` + `typescript-eslint`      | Linting                                      |
| `prettier`                          | Code formatting                              |

---

## License

This project is private. See the repository for license details.
