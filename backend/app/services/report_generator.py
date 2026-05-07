"""
PDF Report Generator for Sentivoy security status reports.
Uses ReportLab to produce professional multi-page PDF documents.
"""

import io
from datetime import datetime, timedelta
from typing import List, Dict, Any
from collections import defaultdict

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# ── Color Palette (Dark branded theme on white PDF) ───────────
BRAND_PRIMARY = colors.HexColor("#6366f1")
BRAND_PURPLE = colors.HexColor("#8b5cf6")
BRAND_DARK = colors.HexColor("#18181b")
BRAND_DARKER = colors.HexColor("#09090b")
BRAND_MUTED = colors.HexColor("#71717a")
BRAND_BORDER = colors.HexColor("#e4e4e7")
SEVERITY_CRITICAL = colors.HexColor("#ef4444")
SEVERITY_HIGH = colors.HexColor("#f59e0b")
SEVERITY_MEDIUM = colors.HexColor("#6366f1")
SEVERITY_LOW = colors.HexColor("#22c55e")
WHITE = colors.white
BLACK = colors.HexColor("#09090b")


def _get_styles():
    """Build custom paragraph styles for the report."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=28,
        leading=34,
        textColor=BRAND_DARK,
        fontName="Helvetica-Bold",
        spaceAfter=6,
    ))

    styles.add(ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=12,
        textColor=BRAND_MUTED,
        fontName="Helvetica",
        spaceAfter=20,
    ))

    styles.add(ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=16,
        leading=20,
        textColor=BRAND_PRIMARY,
        fontName="Helvetica-Bold",
        spaceBefore=24,
        spaceAfter=12,
    ))

    styles.add(ParagraphStyle(
        "SubSection",
        parent=styles["Heading3"],
        fontSize=12,
        leading=16,
        textColor=BRAND_DARK,
        fontName="Helvetica-Bold",
        spaceBefore=14,
        spaceAfter=8,
    ))

    styles.add(ParagraphStyle(
        "BodyText2",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=BRAND_DARK,
        fontName="Helvetica",
        spaceAfter=8,
    ))

    styles.add(ParagraphStyle(
        "MetricValue",
        parent=styles["Normal"],
        fontSize=26,
        leading=32,
        textColor=BRAND_DARK,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
    ))

    styles.add(ParagraphStyle(
        "MetricLabel",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=BRAND_MUTED,
        fontName="Helvetica",
        alignment=TA_CENTER,
        spaceAfter=4,
    ))

    styles.add(ParagraphStyle(
        "FooterText",
        parent=styles["Normal"],
        fontSize=8,
        textColor=BRAND_MUTED,
        fontName="Helvetica",
        alignment=TA_CENTER,
    ))

    return styles


def _severity_color(severity: str) -> colors.Color:
    """Map severity string to a color."""
    mapping = {
        "critical": SEVERITY_CRITICAL,
        "high": SEVERITY_HIGH,
        "medium": SEVERITY_MEDIUM,
        "low": SEVERITY_LOW,
    }
    return mapping.get(severity.lower(), BRAND_MUTED)


def _add_footer(canvas, doc):
    """Draw footer on every page."""
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(BRAND_MUTED)
    canvas.drawCentredString(
        A4[0] / 2,
        20 * mm,
        f"Sentivoy Security Report · Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} · Page {doc.page}"
    )
    # Accent line at bottom
    canvas.setStrokeColor(BRAND_PRIMARY)
    canvas.setLineWidth(2)
    canvas.line(30 * mm, 18 * mm, A4[0] - 30 * mm, 18 * mm)
    canvas.restoreState()


def generate_status_report_pdf(
    tenant_id: str,
    user_email: str,
    metrics: Dict[str, Any],
    anomalies_data: List[Dict[str, Any]],
    logs_data: Dict[str, Dict[str, Any]],
    threat_patterns: List[Dict[str, Any]],
    geo_origins: List[Dict[str, Any]],
) -> bytes:
    """
    Generate a comprehensive PDF security status report.

    Args:
        tenant_id: Customer tenant ID
        user_email: User's email for the report header
        metrics: Dashboard metrics dict (logs, anomalies, critical, threats, blocked)
        anomalies_data: List of anomaly records from DB
        logs_data: Dict mapping log_id to log record
        threat_patterns: List of threat pattern dicts (name, value)
        geo_origins: List of geo origin dicts (country, threats, intensity)

    Returns:
        PDF bytes
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=30 * mm,
        rightMargin=30 * mm,
        topMargin=25 * mm,
        bottomMargin=30 * mm,
    )

    styles = _get_styles()
    elements = []

    # ══════════════════════════════════════════════════════════════
    # PAGE 1 — COVER & EXECUTIVE SUMMARY
    # ══════════════════════════════════════════════════════════════

    elements.append(Spacer(1, 40))

    # Accent bar
    elements.append(HRFlowable(
        width="100%", thickness=3, color=BRAND_PRIMARY,
        spaceAfter=20, spaceBefore=0,
    ))

    elements.append(Paragraph("Sentivoy", styles["ReportTitle"]))
    elements.append(Paragraph("Security Status Report", ParagraphStyle(
        "CoverSub", parent=styles["ReportSubtitle"],
        fontSize=18, textColor=BRAND_PURPLE, spaceAfter=8,
    )))

    report_date = datetime.utcnow().strftime("%B %d, %Y")
    date_range_start = (datetime.utcnow() - timedelta(days=30)).strftime("%b %d, %Y")
    date_range_end = datetime.utcnow().strftime("%b %d, %Y")

    cover_info = [
        f"<b>Report Date:</b> {report_date}",
        f"<b>Period:</b> {date_range_start} — {date_range_end}",
        f"<b>Tenant:</b> {tenant_id[:16]}...",
        f"<b>Prepared for:</b> {user_email}",
    ]
    for info in cover_info:
        elements.append(Paragraph(info, styles["BodyText2"]))

    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(
        width="100%", thickness=1, color=BRAND_BORDER,
        spaceAfter=30, spaceBefore=0,
    ))

    # Executive Summary metrics
    elements.append(Paragraph("Executive Summary", styles["SectionHeader"]))

    # Build metrics table
    total_logs = metrics.get("logs", 0)
    total_anomalies = metrics.get("anomalies", 0)
    critical_count = metrics.get("critical", 0)
    threats_count = metrics.get("threats", 0)
    blocked_count = metrics.get("blocked", 0)

    # Risk score calculation
    if total_logs > 0:
        risk_ratio = min((critical_count * 3 + total_anomalies) / max(total_logs, 1) * 100, 100)
    else:
        risk_ratio = 0
    risk_label = "Low" if risk_ratio < 5 else "Medium" if risk_ratio < 15 else "High" if risk_ratio < 30 else "Critical"

    metric_data = [
        [
            Paragraph(f"{total_logs:,}", styles["MetricValue"]),
            Paragraph(f"{total_anomalies:,}", styles["MetricValue"]),
            Paragraph(f"{critical_count:,}", styles["MetricValue"]),
            Paragraph(f"{blocked_count:,}", styles["MetricValue"]),
        ],
        [
            Paragraph("Total Logs", styles["MetricLabel"]),
            Paragraph("Anomalies", styles["MetricLabel"]),
            Paragraph("Critical Alerts", styles["MetricLabel"]),
            Paragraph("Blocked IPs", styles["MetricLabel"]),
        ],
    ]

    metric_table = Table(metric_data, colWidths=[doc.width / 4] * 4)
    metric_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f4f4f5")),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#fafafa")),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ("TOPPADDING", (0, 0), (-1, 0), 16),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 1), (-1, 1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 1, BRAND_BORDER),
    ]))
    elements.append(metric_table)
    elements.append(Spacer(1, 16))

    # Risk score box
    risk_color = _severity_color(risk_label.lower())
    elements.append(Paragraph(
        f"<b>Overall Risk Score:</b> <font color='{risk_color}'>{risk_ratio:.1f}% — {risk_label}</font>",
        styles["BodyText2"],
    ))

    elements.append(Spacer(1, 8))
    elements.append(Paragraph(
        "This report provides a comprehensive overview of your platform's security posture as analyzed by Sentivoy's "
        "AI-powered anomaly detection engine. Below you will find detailed breakdowns of detected threats, "
        "their severity, geographic origins, and actionable recommendations.",
        styles["BodyText2"],
    ))

    # ══════════════════════════════════════════════════════════════
    # PAGE 2 — ANOMALY BREAKDOWN
    # ══════════════════════════════════════════════════════════════
    elements.append(PageBreak())
    elements.append(Paragraph("Anomaly Breakdown", styles["SectionHeader"]))
    elements.append(Paragraph(
        "The following table shows recent anomalies detected on your platform, "
        "sorted by severity. Each entry includes the AI engine's reasoning.",
        styles["BodyText2"],
    ))

    # Severity distribution
    severity_counts = defaultdict(int)
    for a in anomalies_data:
        sev = a.get("final_severity", "low")
        severity_counts[sev] += 1

    sev_data = [
        [
            Paragraph("<b>Severity</b>", styles["BodyText2"]),
            Paragraph("<b>Count</b>", styles["BodyText2"]),
            Paragraph("<b>Percentage</b>", styles["BodyText2"]),
        ]
    ]
    total_a = max(len(anomalies_data), 1)
    for sev in ["critical", "high", "medium", "low"]:
        count = severity_counts.get(sev, 0)
        pct = (count / total_a) * 100
        sev_color = _severity_color(sev)
        sev_data.append([
            Paragraph(f"<font color='{sev_color}'><b>{sev.capitalize()}</b></font>", styles["BodyText2"]),
            Paragraph(str(count), styles["BodyText2"]),
            Paragraph(f"{pct:.1f}%", styles["BodyText2"]),
        ])

    sev_table = Table(sev_data, colWidths=[doc.width * 0.4, doc.width * 0.3, doc.width * 0.3])
    sev_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f4f4f5")),
        ("GRID", (0, 0), (-1, -1), 0.5, BRAND_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#fafafa")]),
    ]))
    elements.append(sev_table)
    elements.append(Spacer(1, 16))

    # Recent anomalies detail table (top 15)
    elements.append(Paragraph("Recent Anomaly Details", styles["SubSection"]))

    anomaly_header = [
        Paragraph("<b>Event</b>", styles["BodyText2"]),
        Paragraph("<b>Severity</b>", styles["BodyText2"]),
        Paragraph("<b>Score</b>", styles["BodyText2"]),
        Paragraph("<b>Action</b>", styles["BodyText2"]),
        Paragraph("<b>IP</b>", styles["BodyText2"]),
    ]

    anomaly_rows = [anomaly_header]
    sorted_anomalies = sorted(anomalies_data, key=lambda a: a.get("reconstruction_error", 0), reverse=True)[:15]

    for a in sorted_anomalies:
        log = logs_data.get(a.get("log_id", ""), {})
        sev = a.get("final_severity", "low")
        sev_color = _severity_color(sev)

        anomaly_rows.append([
            Paragraph(log.get("event_type", "N/A").replace("_", " ").title(), styles["BodyText2"]),
            Paragraph(f"<font color='{sev_color}'><b>{sev.capitalize()}</b></font>", styles["BodyText2"]),
            Paragraph(f"{a.get('reconstruction_error', 0):.4f}", styles["BodyText2"]),
            Paragraph(a.get("action_recommendation", "N/A").replace("_", " ").title(), styles["BodyText2"]),
            Paragraph(log.get("ip_address", "N/A"), styles["BodyText2"]),
        ])

    if len(anomaly_rows) == 1:
        anomaly_rows.append([
            Paragraph("No anomalies detected", styles["BodyText2"]),
            Paragraph("—", styles["BodyText2"]),
            Paragraph("—", styles["BodyText2"]),
            Paragraph("—", styles["BodyText2"]),
            Paragraph("—", styles["BodyText2"]),
        ])

    col_widths = [doc.width * 0.22, doc.width * 0.18, doc.width * 0.18, doc.width * 0.2, doc.width * 0.22]
    anomaly_table = Table(anomaly_rows, colWidths=col_widths)
    anomaly_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f4f4f5")),
        ("GRID", (0, 0), (-1, -1), 0.5, BRAND_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#fafafa")]),
    ]))
    elements.append(anomaly_table)

    # ══════════════════════════════════════════════════════════════
    # PAGE 3 — THREAT PATTERNS & GEO DISTRIBUTION
    # ══════════════════════════════════════════════════════════════
    elements.append(PageBreak())
    elements.append(Paragraph("Threat Pattern Analysis", styles["SectionHeader"]))
    elements.append(Paragraph(
        "Distribution of anomalous events by event type, showing which behaviors "
        "are most frequently flagged by the AI engine.",
        styles["BodyText2"],
    ))

    tp_header = [
        Paragraph("<b>Threat Type</b>", styles["BodyText2"]),
        Paragraph("<b>Occurrences</b>", styles["BodyText2"]),
        Paragraph("<b>Share</b>", styles["BodyText2"]),
    ]
    tp_rows = [tp_header]
    total_threats = sum(t.get("value", 0) for t in threat_patterns)

    for tp in threat_patterns:
        name = tp.get("name", "Unknown")
        value = tp.get("value", 0)
        share = (value / max(total_threats, 1)) * 100
        tp_rows.append([
            Paragraph(name, styles["BodyText2"]),
            Paragraph(str(value), styles["BodyText2"]),
            Paragraph(f"{share:.1f}%", styles["BodyText2"]),
        ])

    if len(tp_rows) == 1:
        tp_rows.append([
            Paragraph("No threats detected", styles["BodyText2"]),
            Paragraph("0", styles["BodyText2"]),
            Paragraph("0%", styles["BodyText2"]),
        ])

    tp_table = Table(tp_rows, colWidths=[doc.width * 0.45, doc.width * 0.25, doc.width * 0.3])
    tp_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f4f4f5")),
        ("GRID", (0, 0), (-1, -1), 0.5, BRAND_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#fafafa")]),
    ]))
    elements.append(tp_table)

    elements.append(Spacer(1, 24))

    # Geographic Distribution
    elements.append(Paragraph("Geographic Threat Distribution", styles["SectionHeader"]))
    elements.append(Paragraph(
        "Origins of detected threats based on source IP geolocation analysis.",
        styles["BodyText2"],
    ))

    geo_header = [
        Paragraph("<b>Country</b>", styles["BodyText2"]),
        Paragraph("<b>Threats</b>", styles["BodyText2"]),
        Paragraph("<b>Risk Level</b>", styles["BodyText2"]),
    ]
    geo_rows = [geo_header]

    for geo in geo_origins:
        country = geo.get("country", "Unknown")
        threats = geo.get("threats", 0)
        intensity = geo.get("intensity", "low")
        intensity_color = _severity_color(
            "critical" if intensity == "critical" else
            "high" if intensity == "high" else
            "medium" if intensity == "medium" else "low"
        )
        geo_rows.append([
            Paragraph(country, styles["BodyText2"]),
            Paragraph(str(threats), styles["BodyText2"]),
            Paragraph(
                f"<font color='{intensity_color}'><b>{intensity.capitalize()}</b></font>",
                styles["BodyText2"]
            ),
        ])

    if len(geo_rows) == 1:
        geo_rows.append([
            Paragraph("No geographic data", styles["BodyText2"]),
            Paragraph("0", styles["BodyText2"]),
            Paragraph("—", styles["BodyText2"]),
        ])

    geo_table = Table(geo_rows, colWidths=[doc.width * 0.45, doc.width * 0.25, doc.width * 0.3])
    geo_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f4f4f5")),
        ("GRID", (0, 0), (-1, -1), 0.5, BRAND_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#fafafa")]),
    ]))
    elements.append(geo_table)

    # ══════════════════════════════════════════════════════════════
    # PAGE 4 — RECOMMENDATIONS
    # ══════════════════════════════════════════════════════════════
    elements.append(PageBreak())
    elements.append(Paragraph("AI Recommendations", styles["SectionHeader"]))
    elements.append(Paragraph(
        "Based on the analysis of your platform's security data, the Sentivoy AI engine "
        "provides the following recommendations:",
        styles["BodyText2"],
    ))

    # Generate contextual recommendations
    recommendations = _generate_recommendations(
        metrics, anomalies_data, severity_counts, threat_patterns, geo_origins
    )

    for i, rec in enumerate(recommendations, 1):
        elements.append(Paragraph(
            f"<b>{i}. {rec['title']}</b>",
            ParagraphStyle("RecTitle", parent=styles["BodyText2"], fontSize=11, textColor=BRAND_DARK, spaceBefore=12),
        ))
        elements.append(Paragraph(
            rec["description"],
            ParagraphStyle("RecDesc", parent=styles["BodyText2"], textColor=BRAND_MUTED, leftIndent=16),
        ))

    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(
        width="100%", thickness=2, color=BRAND_PRIMARY,
        spaceAfter=12, spaceBefore=0,
    ))

    elements.append(Paragraph(
        "This report was auto-generated by the Sentivoy AI Security Engine. "
        "For questions or support, contact your security team.",
        styles["FooterText"],
    ))

    # Build PDF
    doc.build(elements, onFirstPage=_add_footer, onLaterPages=_add_footer)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def _generate_recommendations(
    metrics: Dict,
    anomalies_data: List[Dict],
    severity_counts: Dict,
    threat_patterns: List[Dict],
    geo_origins: List[Dict],
) -> List[Dict[str, str]]:
    """Generate contextual security recommendations based on data."""
    recommendations = []

    critical_count = severity_counts.get("critical", 0)
    high_count = severity_counts.get("high", 0)
    blocked = metrics.get("blocked", 0)

    if critical_count > 0:
        recommendations.append({
            "title": "Investigate Critical Alerts Immediately",
            "description": (
                f"Your platform has {critical_count} critical-severity anomalies. "
                "These require immediate investigation as they indicate potential active threats. "
                "Review the anomaly details, correlate with your internal logs, and escalate as needed."
            ),
        })

    if high_count > 3:
        recommendations.append({
            "title": "Review Elevated Threat Activity",
            "description": (
                f"There are {high_count} high-severity events detected. Consider implementing "
                "additional access controls, reviewing user permissions, and enabling MFA for all "
                "privileged accounts."
            ),
        })

    # Check for login-related threats
    login_threats = [t for t in threat_patterns if "login" in t.get("name", "").lower()]
    if login_threats and login_threats[0].get("value", 0) > 2:
        recommendations.append({
            "title": "Strengthen Authentication Controls",
            "description": (
                "Multiple anomalous login events have been detected. Consider enforcing "
                "multi-factor authentication, implementing IP-based access restrictions, "
                "and reviewing failed login attempt thresholds."
            ),
        })

    # Check for data export threats
    export_threats = [t for t in threat_patterns if "export" in t.get("name", "").lower()]
    if export_threats and export_threats[0].get("value", 0) > 0:
        recommendations.append({
            "title": "Audit Data Export Activities",
            "description": (
                "Anomalous data export events have been flagged. Review data access policies, "
                "implement data loss prevention (DLP) controls, and ensure all bulk exports "
                "are authorized."
            ),
        })

    # Geo-based
    high_risk_geos = [g for g in geo_origins if g.get("intensity") in ["critical", "high"]]
    if high_risk_geos:
        countries = ", ".join(g.get("country", "Unknown") for g in high_risk_geos[:3])
        recommendations.append({
            "title": "Geo-Restrict Suspicious Origins",
            "description": (
                f"Elevated threat activity has been detected from: {countries}. "
                "Consider implementing geo-based access restrictions or additional "
                "verification for logins from these regions."
            ),
        })

    if blocked > 0:
        recommendations.append({
            "title": "Review Blocked IP Addresses",
            "description": (
                f"The system has auto-blocked {blocked} IP addresses. Review these blocks "
                "to ensure no legitimate users are affected, and consider adding persistent "
                "firewall rules for confirmed malicious sources."
            ),
        })

    # Always add a general recommendation
    recommendations.append({
        "title": "Continuous Monitoring Best Practices",
        "description": (
            "Ensure all log sources are connected, keep anomaly detection models updated, "
            "and schedule regular security reviews. Enable real-time alerting for critical "
            "events and maintain an incident response playbook."
        ),
    })

    return recommendations
