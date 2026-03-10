"""
app/services/mailer.py

send_digest() accepts years_of_experience (schema column).
Email design matches the JobFeed dashboard:
  - Background: #0a0a0a / #111
  - Accent: #00d4ff (cyan)
  - Font: JetBrains Mono (monospace)
  - Borders: #1e1e1e with cyan left-border on active cards
  - Score badges match dashboard level colors
"""

import html as html_lib
import resend
import asyncio
from app.config import get_settings


def _h(v: str) -> str:
    return html_lib.escape(str(v or ""))


def _level_label(years: int) -> str:
    if years == 0:  return "Fresher"
    if years <= 2:  return "Junior"
    if years <= 5:  return "Mid-level"
    if years <= 10: return "Senior"
    return "Expert"


def _level_color(years: int) -> str:
    if years == 0:  return "#ff6b9d"
    if years <= 2:  return "#ff9d4d"
    if years <= 10: return "#00d4ff"
    return "#ffd700"


def build_email_html(name: str, jobs: list[dict], years_of_experience: int = 0) -> str:
    is_fresher = years_of_experience == 0
    level      = _level_label(years_of_experience)
    level_color = _level_color(years_of_experience)
    rows       = ""

    for i, j in enumerate(jobs, 1):
        score     = j.get("score", 0)
        apply_url = j.get("apply_url", "#")
        source    = _h(j.get("source", "unknown")).upper()
        title     = _h(j.get("title", ""))
        company   = _h(j.get("company", ""))
        location  = _h(j.get("location", ""))

        # Score tiers — match dashboard level colors
        if score >= 70:
            score_color  = "#00d4ff"
            score_border = "rgba(0,212,255,0.4)"
            score_bg     = "rgba(0,212,255,0.1)"
            match_label  = "STRONG_MATCH"
            match_color  = "#00d4ff"
            left_border  = "#00d4ff"
        elif score >= 40:
            score_color  = "#ff9d4d"
            score_border = "rgba(255,157,77,0.4)"
            score_bg     = "rgba(255,157,77,0.08)"
            match_label  = "GOOD_MATCH"
            match_color  = "#ff9d4d"
            left_border  = "#ff9d4d"
        else:
            score_color  = "#555555"
            score_border = "#2a2a2a"
            score_bg     = "#1a1a1a"
            match_label  = "WEAK_MATCH"
            match_color  = "#555555"
            left_border  = "#1e1e1e"

        # Text colors — always bright white for title/company/location
        title_color   = "#ffffff"
        company_color = "#cccccc"
        loc_color     = "#888888"

        # Entry-level badge for freshers
        entry_badge = ""
        if is_fresher and j.get("is_entry_level"):
            entry_badge = (
                '&nbsp;<span style="display:inline-block;background:rgba(0,212,255,0.1);'
                'color:#00d4ff;border:1px solid rgba(0,212,255,0.3);'
                'padding:1px 8px;font-size:9px;font-weight:700;letter-spacing:1.5px;'
                'font-family:\'Courier New\',monospace;vertical-align:middle;">'
                'ENTRY_LEVEL</span>'
            )

        rows += f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
  <tr>
    <td style="background:#111111;border:1px solid #1e1e1e;border-left:2px solid {left_border};">

      <!-- Card header -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:18px 20px 0 20px;">
        <tr>
          <td style="vertical-align:top;">
            <!-- match label -->
            <p style="margin:0 0 8px;font-family:'Courier New',Courier,monospace;font-size:10px;
                      font-weight:700;color:{match_color};letter-spacing:2px;text-transform:uppercase;">
              // {match_label}
            </p>
            <!-- title -->
            <p style="margin:0 0 6px;font-family:'Courier New',Courier,monospace;font-size:20px;
                      font-weight:700;color:#ffffff;line-height:1.3;">
              {title}{entry_badge}
            </p>
            <!-- company -->
            <p style="margin:0 0 6px;font-family:'Courier New',Courier,monospace;font-size:15px;
                      font-weight:600;color:#ffffff;">{company}</p>
            <!-- location + source -->
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:13px;color:#888888;">
              &#9679; {location} &nbsp;&middot;&nbsp; {source}
            </p>
          </td>

          <!-- Score badge -->
          <td style="vertical-align:top;text-align:right;padding-left:16px;white-space:nowrap;">
            <span style="display:inline-block;background:{score_bg};color:{score_color};
                         border:1px solid {score_border};
                         padding:8px 14px;
                         font-family:'Courier New',Courier,monospace;
                         font-size:22px;font-weight:700;line-height:1;">
              {score}
            </span>
            <p style="margin:4px 0 0;font-family:'Courier New',Courier,monospace;
                      font-size:9px;color:#555;letter-spacing:1px;">/ 100</p>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:14px 20px 0 20px;">
        <tr><td style="border-top:1px solid #1e1e1e;font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>

      <!-- Apply button — always cyan #00d4ff -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:12px 20px 18px 20px;">
        <tr>
          <td>
            <a href="{_h(apply_url)}"
               style="display:inline-block;background:#00d4ff;color:#000000;
                      text-decoration:none;padding:8px 20px;
                      font-family:'Courier New',Courier,monospace;
                      font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
              APPLY_NOW &rarr;
            </a>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <span style="font-family:'Courier New',Courier,monospace;font-size:9px;
                         color:#333;letter-spacing:1px;">#{i:02d}</span>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>"""

    # Level badge for header
    level_badge = (
        f'<span style="display:inline-block;background:rgba(0,212,255,0.08);'
        f'color:{level_color};border:1px solid {level_color}40;'
        f'padding:3px 12px;'
        f'font-family:\'Courier New\',Courier,monospace;'
        f'font-size:10px;font-weight:700;letter-spacing:1.5px;">'
        f'// {level.upper()}_MODE &mdash; {len(jobs)} matches today'
        f'</span>'
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>JobFeed Digest</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',Courier,monospace;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;padding:36px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

      <!-- ═══════════════════════════════════════
           HEADER
           ═══════════════════════════════════════ -->
      <tr>
        <td style="background:#111111;border:1px solid #1e1e1e;border-top:2px solid #00d4ff;
                   padding:28px 28px 24px 28px;">

          <!-- Wordmark -->
          <p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;
                    font-size:10px;font-weight:700;color:#555;letter-spacing:3px;">
            // JOBFEED
          </p>
          <p style="margin:0 0 20px;font-family:'Courier New',Courier,monospace;
                    font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
            <span style="color:#00d4ff;">&#9889;</span> Daily Digest
          </p>

          <!-- Greeting -->
          <p style="margin:0 0 6px;font-family:'Courier New',Courier,monospace;
                    font-size:18px;font-weight:700;color:#e0e0e0;">
            Hello, {_h(name) or 'there'}
          </p>
          <p style="margin:0 0 18px;font-family:'Courier New',Courier,monospace;
                    font-size:12px;color:#555;line-height:1.8;">
            Your top job matches for today are ready.
          </p>

          <!-- Level badge -->
          {level_badge}
        </td>
      </tr>

      <!-- spacer -->
      <tr><td style="height:1px;background:#1e1e1e;font-size:0;">&nbsp;</td></tr>

      <!-- ═══════════════════════════════════════
           SECTION LABEL
           ═══════════════════════════════════════ -->
      <tr>
        <td style="background:#111111;border-left:1px solid #1e1e1e;border-right:1px solid #1e1e1e;
                   padding:16px 20px 12px 20px;">
          <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:9px;
                    font-weight:700;color:#00d4ff;letter-spacing:2.5px;text-transform:uppercase;">
            // TODAY'S_PICKS
          </p>
        </td>
      </tr>

      <!-- spacer -->
      <tr><td style="height:1px;background:#1e1e1e;font-size:0;">&nbsp;</td></tr>

      <!-- ═══════════════════════════════════════
           JOB CARDS
           ═══════════════════════════════════════ -->
      <tr><td style="padding:0;">{rows}</td></tr>

      <!-- spacer -->
      <tr><td style="height:1px;background:#1e1e1e;font-size:0;">&nbsp;</td></tr>

      <!-- ═══════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════ -->
      <tr>
        <td style="background:#111111;border:1px solid #1e1e1e;border-left:2px solid #00d4ff;
                   padding:20px 24px;">
          <p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;
                    font-size:10px;font-weight:700;color:#00d4ff;letter-spacing:2px;">
            // JOBFEED
          </p>
          <p style="margin:0;font-family:'Courier New',Courier,monospace;
                    font-size:11px;color:#555;line-height:1.8;">
            You're receiving this because you enabled daily digest at
            <a href="https://jobfeed.site"
               style="color:#00d4ff;text-decoration:none;font-weight:700;">jobfeed.site</a>
          </p>
        </td>
      </tr>

      <!-- bottom spacer -->
      <tr><td style="height:32px;font-size:0;">&nbsp;</td></tr>

    </table>
  </td></tr>
</table>

</body>
</html>"""


async def send_digest(
    to_email: str,
    name: str,
    jobs: list[dict],
    years_of_experience: int = 0,
) -> bool:
    settings = get_settings()

    if not settings.resend_api_key:
        print("Email error: resend_api_key not configured")
        return False
    if not jobs:
        print(f"Email skipped: no jobs for {to_email}")
        return False

    resend.api_key = settings.resend_api_key
    html    = build_email_html(name, jobs, years_of_experience)
    level   = _level_label(years_of_experience)
    subject = (
        f"⚡ Your fresher digest — {len(jobs)} entry-level picks today"
        if years_of_experience == 0
        else f"⚡ Your top {len(jobs)} {level.lower()} jobs today"
    )

    try:
        def _send():
            return resend.Emails.send({
                "from":    settings.email_from,
                "to":      to_email,
                "subject": subject,
                "html":    html,
            })

        resp = await asyncio.to_thread(_send)
        if resp and resp.get("id"):
            print(f"Email sent to {to_email} (id={resp['id']})")
            return True
        print(f"Email unexpected response: {resp}")
        return False

    except Exception as e:
        print(f"Email failed for {to_email}: {e}")
        return False