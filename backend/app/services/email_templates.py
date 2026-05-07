"""
HTML email templates for Sentivoy alert notifications.
Dark-themed, branded templates matching the platform's design language.
"""


def critical_alert_html(
    user_id: str,
    severity: str,
    anomaly_score: float,
    action: str,
    reasoning: str,
    event_type: str,
    ip_address: str,
    timestamp: str,
    dashboard_url: str = "http://localhost:8080",
) -> str:
    """
    Generate a branded HTML email for critical/high severity anomaly alerts.
    """
    severity_upper = severity.upper()
    severity_color = "#ef4444" if severity_upper == "CRITICAL" else "#f59e0b"
    severity_bg = "#3b1111" if severity_upper == "CRITICAL" else "#3b2e11"
    action_label = action.replace("_", " ").title()

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sentivoy Security Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%);border-radius:16px 16px 0 0;padding:32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                      &#128737; Sentivoy
                    </div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">
                      AI Security Command Center
                    </div>
                  </td>
                  <td align="right">
                    <div style="display:inline-block;background:{severity_bg};border:1px solid {severity_color};border-radius:8px;padding:6px 14px;">
                      <span style="font-size:11px;font-weight:800;color:{severity_color};letter-spacing:1px;text-transform:uppercase;">
                        &#9888; {severity_upper}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main body -->
          <tr>
            <td style="background-color:#111113;padding:36px 40px;border-left:1px solid #1e1e24;border-right:1px solid #1e1e24;">

              <!-- Alert title -->
              <h1 style="font-size:20px;font-weight:700;color:#fafafa;margin:0 0 8px 0;letter-spacing:-0.3px;">
                {severity.capitalize()} Disturbance Detected
              </h1>
              <p style="font-size:14px;color:#a1a1aa;margin:0 0 28px 0;line-height:1.6;">
                Our AI engine has flagged a <strong style="color:{severity_color}">{severity_upper}</strong> severity anomaly on your platform. Immediate review is recommended.
              </p>

              <!-- Details table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #27272a;">
                    <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">User ID</div>
                    <div style="font-size:14px;font-weight:600;color:#fafafa;margin-top:4px;font-family:monospace;">{user_id}</div>
                  </td>
                  <td style="padding:16px 20px;border-bottom:1px solid #27272a;">
                    <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Event Type</div>
                    <div style="font-size:14px;font-weight:600;color:#fafafa;margin-top:4px;">{event_type.replace("_", " ").title()}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #27272a;">
                    <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">IP Address</div>
                    <div style="font-size:14px;font-weight:600;color:#fafafa;margin-top:4px;font-family:monospace;">{ip_address}</div>
                  </td>
                  <td style="padding:16px 20px;border-bottom:1px solid #27272a;">
                    <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Timestamp</div>
                    <div style="font-size:14px;font-weight:600;color:#fafafa;margin-top:4px;">{timestamp}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #27272a;">
                    <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Anomaly Score</div>
                    <div style="font-size:20px;font-weight:800;color:{severity_color};margin-top:4px;font-family:monospace;">{anomaly_score:.4f}</div>
                  </td>
                  <td style="padding:16px 20px;border-bottom:1px solid #27272a;">
                    <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Action Taken</div>
                    <div style="font-size:14px;font-weight:700;color:{severity_color};margin-top:4px;">{action_label}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:16px 20px;">
                    <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">AI Reasoning</div>
                    <div style="font-size:13px;color:#d4d4d8;margin-top:6px;line-height:1.6;font-style:italic;">
                      &ldquo;{reasoning}&rdquo;
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td align="center">
                    <a href="{dashboard_url}/alerts"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                      View in Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0c0c0e;border:1px solid #1e1e24;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;">
              <p style="font-size:11px;color:#52525b;margin:0;line-height:1.6;">
                This alert was generated by Sentivoy AI Security Engine. You are receiving this because your platform registered a {severity_upper} level disturbance.
              </p>
              <p style="font-size:11px;color:#3f3f46;margin:12px 0 0 0;">
                &copy; 2026 Sentivoy &middot; AI-Powered Cybersecurity
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
