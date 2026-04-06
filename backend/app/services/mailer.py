"""
app/services/mailer.py

Light-theme email design for JobDigest:
  - Background: #F8FAFC / white cards
  - Accent: #6366F1 (indigo)
  - Typography: system sans-serif
  - Border: #E2E8F0 for card separation
  - Score badges match dashboard level colors (indigo, amber, slate)
"""

import html as html_lib
import resend
import asyncio
from app.config import get_settings

# CHANGED: track whether api_key has been set to avoid reassignment
_resend_key_set = False

def _h(v: str) -> str:
    return html_lib.escape(str(v or ""))


def _level_label(years: int) -> str:
    if years == 0:  return "Fresher"
    if years <= 2:  return "Junior"
    if years <= 5:  return "Mid-level"
    if years <= 10: return "Senior"
    return "Expert"


def _level_color(years: int) -> str:
    if years == 0:  return "#EF4444"
    if years <= 2:  return "#F59E0B"
    if years <= 10: return "#6366F1"
    return "#EAB308"


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

        # Score tiers - light theme colors matching dashboard
        if score >= 70:
            score_color  = "#6366F1"
            score_border = "rgba(99,102,241,0.25)"
            score_bg     = "rgba(99,102,241,0.08)"
            match_label  = "STRONG MATCH"
            match_color  = "#6366F1"
            accent       = "#6366F1"
        elif score >= 40:
            score_color  = "#F59E0B"
            score_border = "rgba(245,158,11,0.25)"
            score_bg     = "rgba(245,158,11,0.08)"
            match_label  = "GOOD MATCH"
            match_color  = "#F59E0B"
            accent       = "#F59E0B"
        else:
            score_color  = "#64748B"
            score_border = "rgba(100,116,139,0.2)"
            score_bg     = "rgba(100,116,139,0.06)"
            match_label  = "WEAK MATCH"
            match_color  = "#64748B"
            accent       = "#CBD5E1"

        # Entry-level badge
        entry_badge = ""
        if is_fresher and j.get("is_entry_level"):
            entry_badge = (
                '&nbsp;<span style="display:inline-block;background:rgba(99,102,241,0.08);'
                'color:#6366F1;border:1px solid rgba(99,102,241,0.2);'
                'padding:2px 8px;font-size:9px;font-weight:700;letter-spacing:1px;'
                'vertical-align:middle;">'
                'ENTRY LEVEL</span>'
            )

        rows += f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
  <tr>
    <td style="background:#FFFFFF;border:1px solid #E2E8F0;border-left:3px solid {accent};border-radius:2px;">

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
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0F172A;line-height:1.3;">
              {title}{entry_badge}
            </p>
            <!-- company -->
            <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#475569;">{company}</p>
            <!-- location + source -->
            <p style="margin:0;font-size:13px;color:#94A3B8;">
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
                      font-size:9px;color:#94A3B8;letter-spacing:1px;">/ 100</p>
          </td>
        </tr>
      </table>

      <!-- Apply button -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:16px 20px 18px 20px;">
        <tr>
          <td>
            <a href="{_h(apply_url)}"
               style="display:inline-block;background:#6366F1;color:#FFFFFF;
                      text-decoration:none;padding:10px 24px;
                      font-family:'Courier New',Courier,monospace;
                      font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
              Apply Now &rarr;
            </a>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <span style="font-family:'Courier New',Courier,monospace;font-size:9px;
                         color:#CBD5E1;letter-spacing:1px;">#{i:02d}</span>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>"""

    # Level badge for header
    level_badge = (
        f'<span style="display:inline-block;background:rgba(99,102,241,0.06);'
        f'color:{level_color};border:1px solid {level_color}40;'
        f'padding:3px 12px;'
        f'font-family:\'Courier New\',Courier,monospace;'
        f'font-size:10px;font-weight:700;letter-spacing:1.5px;">'
        f'// {level.upper()} &mdash; {len(jobs)} matches today'
        f'</span>'
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>JobDigest Daily Digest</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;padding:36px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

      <!-- ═══════════════════════════════════════
           HEADER
           ═══════════════════════════════════════ -->
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E2E8F0;border-top:3px solid #6366F1;
                   padding:28px 28px 24px 28px;">

          <!-- Wordmark -->
          <p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;
                    font-size:10px;font-weight:700;color:#94A3B8;letter-spacing:3px;">
            // JOBDIGEST
          </p>
          <p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.5px;">
            <span style="color:#6366F1;">&#9889;</span> Daily Digest
          </p>

          <!-- Greeting -->
          <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0F172A;">
            Hello, {_h(name) or 'there'}
          </p>
          <p style="margin:0 0 18px;font-size:13px;color:#64748B;line-height:1.6;">
            Your top job matches for today are ready.
          </p>

          <!-- Level badge -->
          {level_badge}
        </td>
      </tr>

      <!-- spacer -->
      <tr><td style="height:16px;font-size:0;">&nbsp;</td></tr>

      <!-- ═══════════════════════════════════════
           SECTION LABEL
           ═══════════════════════════════════════ -->
      <tr>
        <td style="background:#FFFFFF;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;
                   padding:16px 20px 12px 20px;">
          <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:9px;
                    font-weight:700;color:#6366F1;letter-spacing:2.5px;text-transform:uppercase;">
            // TODAY'S PICKS
          </p>
        </td>
      </tr>

      <tr><td style="height:1px;background:#E2E8F0;font-size:0;">&nbsp;</td></tr>

      <!-- ═══════════════════════════════════════
           JOB CARDS
           ═══════════════════════════════════════ -->
      <tr><td style="padding:0;background:#FFFFFF;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">{rows}</td></tr>

      <!-- spacer -->
      <tr><td style="height:16px;font-size:0;">&nbsp;</td></tr>

      <!-- ═══════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════ -->
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#CBD5E1;">
            JOBDIGEST
          </p>
          <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.8;">
            You're receiving this because you enabled daily digest at
            <a href="https://jobfeed.site"
               style="color:#6366F1;text-decoration:none;font-weight:600;">jobfeed.site</a>
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

    # CHANGED: set api_key once at module level instead of on every call
    global _resend_key_set
    if not _resend_key_set:
        resend.api_key = settings.resend_api_key
        _resend_key_set = True

    html    = build_email_html(name, jobs, years_of_experience)
    level   = _level_label(years_of_experience)
    subject = (
        f"Your fresher digest - {len(jobs)} entry-level picks today"
        if years_of_experience == 0
        else f"Your top {len(jobs)} {level.lower()} jobs today"
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
