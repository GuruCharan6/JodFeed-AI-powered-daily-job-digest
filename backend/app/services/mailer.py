"""
app/services/mailer.py

White-theme email design for JobDigest — matches the frontend design system exactly.

Design tokens derived from frontend source:
  Font family:  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                'Helvetica Neue', Arial, sans-serif  (web-safe fallback for Geist Sans)
  --radius:     0.75rem = 12px  (rounded-xl for cards, rounded-full for badges)
  Primary:      hsl(262 83% 58%) = #8B5CF6 (violet)
  Text:         #0F172A (slate-900 foreground)
  Muted text:   #64748B (slate-500 secondary text)
  Light muted:  #94A3B8 (slate-400 tertiary text)
  Border:       #E2E8F0 (slate-200)
  Background:   #F8FAFC (slate-50)
  Surface:      #FFFFFF (white cards)
  Success:      #10b981 (emerald-500)
  Warning:      #f59e0b (amber-500)
  Error:        #ef4444 (red-500)
"""

import html as html_lib
import resend
import asyncio
from app.config import get_settings

# Track whether api_key has been set to avoid reassignment
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
    if years <= 5:  return "#8B5CF6"
    if years <= 10: return "#7C3AED"
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

        # Score tiers — match dashboard deriveLevel() colors
        if score >= 70:
            score_color  = "#7C3AED"
            score_bg     = "rgba(124,58,237,0.06)"
            score_border = "rgba(124,58,237,0.2)"
            match_label  = "STRONG MATCH"
            match_color  = "#7C3AED"
            accent       = "#7C3AED"
        elif score >= 40:
            score_color  = "#F59E0B"
            score_bg     = "rgba(245,158,11,0.06)"
            score_border = "rgba(245,158,11,0.2)"
            match_label  = "GOOD MATCH"
            match_color  = "#F59E0B"
            accent       = "#F59E0B"
        else:
            score_color  = "#64748B"
            score_bg     = "rgba(100,116,139,0.06)"
            score_border = "rgba(100,116,139,0.15)"
            match_label  = "WEAK MATCH"
            match_color  = "#64748B"
            accent       = "#CBD5E1"

        # Entry-level badge — matches frontend Tag component: rounded-full, bg-primary/10, border-primary/20
        entry_badge = ""
        if is_fresher and j.get("is_entry_level"):
            entry_badge = (
                '&nbsp;<span style="display:inline-flex;align-items:center;gap:4px;'
                'background:rgba(124,58,237,0.1);color:#7C3AED;'
                'border:1px solid rgba(124,58,237,0.2);'
                'padding:2px 10px;font-size:11px;font-weight:500;'
                'border-radius:9999px;vertical-align:middle;">'
                'Entry Level'
                '</span>'
            )

        # Job card — matches frontend SectionCard: bg-card, border-border, rounded-xl, 3px left accent
        rows += f"""<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
  <tr>
    <td style="background:#FFFFFF;border:1px solid #E2E8F0;border-left:3px solid {accent};border-radius:12px;">

      <!-- Card body -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:16px 20px 0 20px;vertical-align:top;">
            <!-- Match label — text-[10px] uppercase tracking-wider font-semibold like frontend section labels -->
            <p style="margin:0 0 6px;font-size:10px;font-weight:600;color:{match_color};letter-spacing:1.5px;text-transform:uppercase;">
              {match_label}
            </p>
            <!-- Title — text-sm font-semibold text-foreground -->
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0F172A;line-height:1.35;">
              {title}{entry_badge}
            </p>
            <!-- Company — muted -->
            <p style="margin:0 0 4px;font-size:13px;font-weight:500;color:#64748B;">{company}</p>
            <!-- Location + source — muted -->
            <p style="margin:0 0 16px;font-size:12px;color:#94A3B8;">
              {location} &nbsp;&middot;&nbsp; {source}
            </p>
          </td>

          <!-- Score badge — matches dashboard level badge: rounded-full, bg + border -->
          <td style="vertical-align:top;text-align:right;padding:16px 20px 0 16px;white-space:nowrap;">
            <span style="display:inline-flex;align-items:baseline;gap:2px;
                         background:{score_bg};color:{score_color};
                         border:1px solid {score_border};
                         padding:6px 12px;
                         font-size:20px;font-weight:700;line-height:1;
                         border-radius:9999px;">
              {score}
            </span>
            <p style="margin:6px 0 0;font-size:10px;font-weight:500;color:#94A3B8;">
              {score} / 100
            </p>
          </td>
        </tr>
      </table>

      <!-- Card footer: Apply button + job index -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:14px 20px 16px 20px;">
            <a href="{_h(apply_url)}"
               style="display:inline-flex;align-items:center;gap:6px;
                      background:#7C3AED;color:#FFFFFF;
                      text-decoration:none;padding:8px 22px;
                      font-size:13px;font-weight:600;
                      border-radius:9999px;">
              Apply Now &#8594;
            </a>
          </td>
          <td style="text-align:right;vertical-align:middle;padding:14px 20px 16px 20px;">
            <span style="font-size:10px;font-weight:500;color:#CBD5E1;letter-spacing:0.5px;">#{i:02d}</span>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>"""

    # Level badge for header — matches frontend Tag pattern: rounded-full, bg/bgBorder
    level_bg       = f"rgba({int(level_color[1:3], 16)},{int(level_color[3:5], 16)},{int(level_color[5:7], 16)},0.05)"
    level_bg_border = f"rgba({int(level_color[1:3], 16)},{int(level_color[3:5], 16)},{int(level_color[5:7], 16)},0.2)"

    level_badge = (
        f'<span style="display:inline-flex;align-items:center;gap:4px;'
        f'background:{level_bg};color:{level_color};'
        f'border:1px solid {level_bg_border};'
        f'padding:4px 14px;border-radius:9999px;'
        f'font-size:11px;font-weight:600;letter-spacing:0.5px;">'
        f'{level} &middot; {len(jobs)} matches today'
        f'</span>'
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>JobDigest Daily Digest</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;padding:32px 16px 48px 16px;">
  <tr><td align="center" valign="top">

    <!-- Inner container: max-width 600px -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#F8FAFC;">

      <!-- ═══════════════════════════════════════════════
           HEADER — Navbar style: logo + gradient line
           ═══════════════════════════════════════════════ -->
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px 12px 0 0;padding:20px 24px;">
          <!-- Logo — matches frontend Navbar: text-lg font-bold text-primary tracking-[-0.02em] -->
          <p style="margin:0 0 2px;font-size:18px;font-weight:700;color:#7C3AED;letter-spacing:-0.02em;">
            Job<span style="color:#0F172A;">Digest</span>
          </p>
          <!-- Greeting -->
          <p style="margin:0 0 2px;font-size:20px;font-weight:700;color:#0F172A;line-height:1.3;">
            Hello, {_h(name) or 'there'}
          </p>
          <p style="margin:0 0 12px;font-size:13px;color:#64748B;line-height:1.5;">
            Your top job matches for today are ready.
          </p>
          <!-- Level badge -->
          {level_badge}
        </td>
      </tr>

      <!-- Gradient divider (simulated as thin line with primary accent) -->
      <tr><td style="height:2px;background:linear-gradient(to right,rgba(124,58,237,0),rgba(124,58,237,0.4),rgba(124,58,237,0));font-size:0;line-height:0;">&nbsp;</td></tr>

      <!-- ═══════════════════════════════════════════════
           SECTION LABEL — "// TODAY'S PICKS"
           Matches frontend: text-[10px] uppercase tracking-wider
           ═══════════════════════════════════════════════ -->
      <tr>
        <td style="padding:18px 24px 10px 24px;background-color:#F8FAFC;">
          <p style="margin:0;font-size:10px;font-weight:600;color:#7C3AED;letter-spacing:1.5px;text-transform:uppercase;">
            Today's Picks
          </p>
        </td>
      </tr>

      <!-- ═══════════════════════════════════════════════
           JOB CARDS
           ═══════════════════════════════════════════════ -->
      <tr>
        <td style="padding:0 0 16px 0;">{rows}</td>
      </tr>

      <!-- ═══════════════════════════════════════════════
           FOOTER — matches frontend footer: text-xs muted
           ═══════════════════════════════════════════════ -->
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:20px 24px;">
          <!-- Footer logo -->
          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#7C3AED;letter-spacing:-0.02em;">
            Job<span style="color:#0F172A;">Digest</span>
          </p>
          <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
            You're receiving this because you enabled daily digest at
            <a href="https://jobfeed.site"
               style="color:#7C3AED;text-decoration:underline;font-weight:500;">
              jobfeed.site
            </a>
          </p>
          <p style="margin:4px 0 0;font-size:11px;color:#CBD5E1;">
            &copy; 2026 JobDigest &middot; Daily job intelligence
          </p>
        </td>
      </tr>

      <!-- Bottom spacer -->
      <tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>

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

    # Set api_key once at module level instead of on every call
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
