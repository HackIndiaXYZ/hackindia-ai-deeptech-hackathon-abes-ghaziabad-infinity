export type Severity = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "Open" | "Investigating" | "Resolved";

export interface AlertRow {
  id: string;
  timestamp: string;
  user: string;
  ip: string;
  event: string;
  severity: Severity;
  status: AlertStatus;
  country: string;
  rawLog: string;
}

export interface TrendPoint {
  time: string;
  anomalies: number;
  critical: number;
}

export interface ThreatPattern {
  name: string;
  value: number;
}

export interface GeoOrigin {
  country: string;
  code: string;
  x: number;
  y: number;
  threats: number;
  intensity: "low" | "medium" | "high" | "critical";
}
