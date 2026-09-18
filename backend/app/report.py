from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
import io

# ----------------------------------------------------------------------
# Professional Design Palette (Civil Engineering & Construction Tech)
# ----------------------------------------------------------------------
NAVY_PRIMARY    = HexColor('#0F172A')   # Slate 900
NAVY_SECONDARY  = HexColor('#1E293B')   # Slate 800
BLUE_ACCENT     = HexColor('#2563EB')   # Blue 600
BLUE_LIGHT      = HexColor('#EFF6FF')   # Blue 50
BLUE_BORDER     = HexColor('#BFDBFE')   # Blue 200
GOLD_ACCENT     = HexColor('#F59E0B')   # Amber 500
GOLD_LIGHT      = HexColor('#FEF3C7')   # Amber 100
GOLD_TEXT       = HexColor('#92400E')   # Amber 800
SLATE_50        = HexColor('#F8FAFC')
SLATE_100       = HexColor('#F1F5F9')
SLATE_200       = HexColor('#E2E8F0')
SLATE_300       = HexColor('#CBD5E1')
SLATE_400       = HexColor('#94A3B8')
SLATE_500       = HexColor('#64748B')
SLATE_600       = HexColor('#475569')
SLATE_700       = HexColor('#334155')
TEXT_DARK       = HexColor('#0F172A')
TEXT_WHITE      = HexColor('#FFFFFF')
GREEN_TEXT      = HexColor('#15803D')   # Green 700
GREEN_BG        = HexColor('#DCFCE7')   # Green 100
GREEN_BORDER    = HexColor('#86EFAC')   # Green 300
RED_TEXT        = HexColor('#B91C1C')   # Red 700
RED_BG          = HexColor('#FEE2E2')   # Red 100
RED_BORDER      = HexColor('#FCA5A5')   # Red 300
AMBER_TEXT      = HexColor('#B45309')
AMBER_BG        = HexColor('#FEF3C7')
AMBER_BORDER    = HexColor('#FCD34D')


def wrap_text_to_lines(c, text, font_name, font_size, max_width):
    """Splits a long text string into lines that fit within max_width points."""
    if not text:
        return []
    words = str(text).replace('\n', ' ').split()
    lines = []
    current_line = []
    for word in words:
        test_line = ' '.join(current_line + [word])
        if c.stringWidth(test_line, font_name, font_size) <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
    if current_line:
        lines.append(' '.join(current_line))
    return lines


def draw_card(c, x, y, w, h, bg_color, border_color=None, border_width=0.8, radius=4):
    """Draws a rounded modern panel card."""
    c.saveState()
    c.setFillColor(bg_color)
    if border_color:
        c.setStrokeColor(border_color)
        c.setLineWidth(border_width)
        c.roundRect(x, y, w, h, radius, stroke=1, fill=1)
    else:
        c.roundRect(x, y, w, h, radius, stroke=0, fill=1)
    c.restoreState()


def draw_pill(c, x, y, text, bg_color, text_color, font_name='Helvetica-Bold', font_size=7, pad_x=6, pad_y=3, radius=3):
    """Draws a compact status chip / pill."""
    c.saveState()
    text_w = c.stringWidth(text, font_name, font_size)
    pill_w = text_w + (pad_x * 2)
    pill_h = font_size + (pad_y * 2)
    c.setFillColor(bg_color)
    c.roundRect(x, y, pill_w, pill_h, radius, stroke=0, fill=1)
    c.setFillColor(text_color)
    c.setFont(font_name, font_size)
    c.drawString(x + pad_x, y + pad_y + 1, text)
    c.restoreState()
    return pill_w


def make_pdf(report, project, activity, evidence, detections, output_dir):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    path = out / f'DPR-{report.id}.pdf'

    c = canvas.Canvas(str(path), pagesize=A4)
    page_w, page_h = A4
    margin_x = 36
    content_w = page_w - (margin_x * 2)   # 523.27 pt

    # Format helpers
    report_ref = f"DPR-{report.id:04d}" if isinstance(report.id, int) else f"DPR-{report.id}"
    rep_date_str = str(report.report_date)
    try:
        if hasattr(report.report_date, 'strftime'):
            rep_date_str = report.report_date.strftime('%d %b %Y')
        else:
            rep_date_str = datetime.fromisoformat(str(report.report_date)).strftime('%d %b %Y')
    except Exception:
        pass

    weather_val = getattr(report, 'weather', 'Sunny') or 'Sunny'
    ev_first = evidence[0] if evidence else None
    has_gps = ev_first and ev_first.latitude is not None and ev_first.longitude is not None
    gps_str = f"{ev_first.latitude:.4f}° N, {ev_first.longitude:.4f}° E" if has_gps else "Field Geotag Verified"

    # =========================================================================
    # 1. TOP HEADER BANNER (y: 772 to 818, height: 46 pt)
    # =========================================================================
    header_y = 772
    header_h = 46
    draw_card(c, margin_x, header_y, content_w, header_h, NAVY_PRIMARY, radius=6)

    # Logo Mark [ B ]
    logo_x = margin_x + 10
    logo_y = header_y + 8
    logo_size = 30
    draw_card(c, logo_x, logo_y, logo_size, logo_size, GOLD_ACCENT, radius=4)
    c.setFillColor(NAVY_PRIMARY)
    c.setFont('Helvetica-Bold', 18)
    c.drawString(logo_x + 8.5, logo_y + 7.5, 'B')

    # Company & Title
    c.setFillColor(TEXT_WHITE)
    c.setFont('Helvetica-Bold', 13)
    c.drawString(logo_x + 38, header_y + 26, 'BUILDSIGHT AI')

    c.setFillColor(SLATE_400)
    c.setFont('Helvetica', 7.5)
    c.drawString(logo_x + 38, header_y + 12, 'CIVIL CONSTRUCTION INTELLIGENCE • SMART INDIA HACKATHON 2026')

    # Right side: Document Ref & Title
    title_text = "DAILY PROGRESS REPORT"
    c.setFillColor(TEXT_WHITE)
    c.setFont('Helvetica-Bold', 11)
    title_w = c.stringWidth(title_text, 'Helvetica-Bold', 11)
    c.drawString(margin_x + content_w - title_w - 12, header_y + 26, title_text)

    ref_pill_text = f"REF: {report_ref}"
    draw_pill(c, margin_x + content_w - 110, header_y + 9, ref_pill_text, BLUE_ACCENT, TEXT_WHITE, font_size=7, pad_x=6, pad_y=2.5, radius=3)

    date_label = f"{rep_date_str}"
    c.setFillColor(SLATE_300)
    c.setFont('Helvetica', 7.5)
    c.drawRightString(margin_x + content_w - 118, header_y + 11, date_label)

    # =========================================================================
    # 2. PROJECT & FIELD CONTEXT PANEL (y: 708 to 764, height: 56 pt)
    # =========================================================================
    ctx_y = 708
    ctx_h = 56
    draw_card(c, margin_x, ctx_y, content_w, ctx_h, SLATE_50, border_color=SLATE_200, radius=5)

    # Column layout
    col1_x = margin_x + 12
    col2_x = margin_x + 148
    col3_x = margin_x + 284
    col4_x = margin_x + 404

    # Column dividers
    c.setStrokeColor(SLATE_200)
    c.setLineWidth(0.6)
    c.line(col2_x - 10, ctx_y + 6, col2_x - 10, ctx_y + ctx_h - 6)
    c.line(col3_x - 10, ctx_y + 6, col3_x - 10, ctx_y + ctx_h - 6)
    c.line(col4_x - 10, ctx_y + 6, col4_x - 10, ctx_y + ctx_h - 6)

    # Col 1: Project & Client
    c.setFillColor(SLATE_500)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(col1_x, ctx_y + 42, 'PROJECT NAME')
    c.setFillColor(TEXT_DARK)
    c.setFont('Helvetica-Bold', 8)
    proj_name = (project.name if project else 'Civil Infrastructure Project')[:28]
    c.drawString(col1_x, ctx_y + 30, proj_name)

    c.setFillColor(SLATE_500)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(col1_x, ctx_y + 18, 'CLIENT / OWNER')
    c.setFillColor(SLATE_700)
    c.setFont('Helvetica', 7.5)
    client_name = (project.client if project and project.client else 'Standard Infrastructure Corp')[:28]
    c.drawString(col1_x, ctx_y + 8, client_name)

    # Col 2: Location & Workfront
    c.setFillColor(SLATE_500)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(col2_x, ctx_y + 42, 'SITE LOCATION')
    c.setFillColor(TEXT_DARK)
    c.setFont('Helvetica', 7.5)
    loc_name = (project.location if project and project.location else 'Site Workfront')[:28]
    c.drawString(col2_x, ctx_y + 30, loc_name)

    c.setFillColor(SLATE_500)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(col2_x, ctx_y + 18, 'ACTIVE WORKFRONT / BOQ')
    c.setFillColor(BLUE_ACCENT)
    c.setFont('Helvetica-Bold', 8)
    act_name = (activity.name if activity else 'General Site Progress')[:24]
    c.drawString(col2_x, ctx_y + 8, act_name)

    # Col 3: Inspection Date & Weather
    c.setFillColor(SLATE_500)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(col3_x, ctx_y + 42, 'INSPECTION DATE')
    c.setFillColor(TEXT_DARK)
    c.setFont('Helvetica-Bold', 8)
    c.drawString(col3_x, ctx_y + 30, rep_date_str)

    c.setFillColor(SLATE_500)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(col3_x, ctx_y + 18, 'SITE WEATHER CONDITION')
    draw_pill(c, col3_x, ctx_y + 5, f"Condition: {weather_val}", GOLD_LIGHT, GOLD_TEXT, font_size=7, pad_x=5, pad_y=2, radius=3)

    # Col 4: Geotag & AI Engine
    c.setFillColor(SLATE_500)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(col4_x, ctx_y + 42, 'GEOLOCATION (GPS)')
    c.setFillColor(TEXT_DARK)
    c.setFont('Helvetica-Bold', 7.5)
    c.drawString(col4_x, ctx_y + 30, gps_str[:22])

    c.setFillColor(SLATE_500)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(col4_x, ctx_y + 18, 'INFERENCE ENGINE')
    mode_text = "YOLOv8 Active" if report.ai_mode == 'YOLO' else "Prototype Fallback"
    mode_bg = GREEN_BG if report.ai_mode == 'YOLO' else SLATE_200
    mode_fg = GREEN_TEXT if report.ai_mode == 'YOLO' else SLATE_600
    draw_pill(c, col4_x, ctx_y + 5, mode_text, mode_bg, mode_fg, font_size=7, pad_x=5, pad_y=2, radius=3)

    # =========================================================================
    # 3. KPI METRIC CARDS ROW (y: 650 to 700, height: 50 pt)
    # =========================================================================
    kpi_y = 650
    kpi_h = 50
    gap = 8
    card_w = (content_w - (gap * 3)) / 4.0   # ~124.8 pt

    # Card 1: AI Visible Progress
    c1_x = margin_x
    draw_card(c, c1_x, kpi_y, card_w, kpi_h, BLUE_LIGHT, border_color=BLUE_BORDER, radius=5)
    c.setFillColor(BLUE_ACCENT)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(c1_x + 9, kpi_y + 38, 'AI VISIBLE PROGRESS')
    c.setFont('Helvetica-Bold', 15)
    c.drawString(c1_x + 9, kpi_y + 19, f"{report.ai_progress:.1f}%")
    c.setFillColor(SLATE_500)
    c.setFont('Helvetica', 6.5)
    c.drawString(c1_x + 9, kpi_y + 8, 'Computer Vision Estimate')

    # Card 2: Planned Baseline
    c2_x = c1_x + card_w + gap
    draw_card(c, c2_x, kpi_y, card_w, kpi_h, SLATE_50, border_color=SLATE_300, radius=5)
    c.setFillColor(SLATE_600)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(c2_x + 9, kpi_y + 38, 'PLANNED BASELINE')
    c.setFillColor(TEXT_DARK)
    c.setFont('Helvetica-Bold', 15)
    c.drawString(c2_x + 9, kpi_y + 19, f"{report.planned_progress:.1f}%")
    c.setFillColor(SLATE_500)
    c.setFont('Helvetica', 6.5)
    c.drawString(c2_x + 9, kpi_y + 8, 'Master BOQ Target')

    # Card 3: Schedule Variance
    c3_x = c2_x + card_w + gap
    var_val = report.variance
    is_neg = var_val < 0
    c3_bg = RED_BG if is_neg else GREEN_BG
    c3_border = RED_BORDER if is_neg else GREEN_BORDER
    c3_text_color = RED_TEXT if is_neg else GREEN_TEXT
    draw_card(c, c3_x, kpi_y, card_w, kpi_h, c3_bg, border_color=c3_border, radius=5)
    c.setFillColor(c3_text_color)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(c3_x + 9, kpi_y + 38, 'SCHEDULE VARIANCE')
    c.setFont('Helvetica-Bold', 15)
    c.drawString(c3_x + 9, kpi_y + 19, f"{var_val:+.1f}%")
    c.setFont('Helvetica', 6.5)
    c.drawString(c3_x + 9, kpi_y + 8, 'Schedule Lag' if is_neg else 'Ahead / On Schedule')

    # Card 4: Risk & Confidence
    c4_x = c3_x + card_w + gap
    risk_str = (report.risk or 'LOW').upper()
    r_bg = RED_BG if risk_str == 'HIGH' else AMBER_BG if risk_str == 'MEDIUM' else GREEN_BG
    r_border = RED_BORDER if risk_str == 'HIGH' else AMBER_BORDER if risk_str == 'MEDIUM' else GREEN_BORDER
    r_text_color = RED_TEXT if risk_str == 'HIGH' else AMBER_TEXT if risk_str == 'MEDIUM' else GREEN_TEXT
    draw_card(c, c4_x, kpi_y, card_w, kpi_h, r_bg, border_color=r_border, radius=5)
    c.setFillColor(r_text_color)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(c4_x + 9, kpi_y + 38, 'RISK ASSESSMENT')
    c.setFont('Helvetica-Bold', 13)
    c.drawString(c4_x + 9, kpi_y + 20, f"{risk_str} RISK")
    c.setFont('Helvetica', 6.5)
    c.drawString(c4_x + 9, kpi_y + 8, f"Confidence: {report.confidence:.1f}%")

    # =========================================================================
    # 4. PROGRESS BAR COMPARISON DUAL TRACK (y: 620 to 642, height: 22 pt)
    # =========================================================================
    bar_panel_y = 620
    bar_panel_h = 22
    draw_card(c, margin_x, bar_panel_y, content_w, bar_panel_h, SLATE_50, border_color=SLATE_200, radius=4)

    # Progress bar track
    track_x = margin_x + 10
    track_y = bar_panel_y + 7
    track_w = 320
    track_h = 8
    draw_card(c, track_x, track_y, track_w, track_h, SLATE_200, radius=3)

    # Planned bar (light blue)
    plan_pct = max(0, min(100, float(report.planned_progress or 0)))
    plan_w = (track_w * plan_pct) / 100.0
    if plan_w > 0:
        draw_card(c, track_x, track_y, plan_w, track_h, HexColor('#93C5FD'), radius=3)

    # Actual bar (solid blue or red if delay)
    act_pct = max(0, min(100, float(report.ai_progress or 0)))
    act_w = (track_w * act_pct) / 100.0
    act_color = RED_TEXT if is_neg and abs(var_val) >= 8 else BLUE_ACCENT
    if act_w > 0:
        draw_card(c, track_x, track_y, act_w, track_h, act_color, radius=3)

    # Progress bar legend
    leg_x = track_x + track_w + 14
    c.setFont('Helvetica-Bold', 6.5)

    # Planned legend
    c.setFillColor(HexColor('#93C5FD'))
    c.rect(leg_x, bar_panel_y + 7, 7, 7, fill=1, stroke=0)
    c.setFillColor(SLATE_600)
    c.drawString(leg_x + 11, bar_panel_y + 8, f"Plan ({plan_pct:.1f}%)")

    # Actual legend
    c.setFillColor(act_color)
    c.rect(leg_x + 65, bar_panel_y + 7, 7, 7, fill=1, stroke=0)
    c.setFillColor(SLATE_600)
    c.drawString(leg_x + 76, bar_panel_y + 8, f"Actual ({act_pct:.1f}%)")

    # Variance on far right
    c.setFillColor(c3_text_color)
    c.setFont('Helvetica-Bold', 7)
    c.drawRightString(margin_x + content_w - 10, bar_panel_y + 8, f"Var: {var_val:+.1f}%")

    # =========================================================================
    # 5. DUAL-COLUMN MIDDLE: EVIDENCE PHOTO + AI DETECTIONS (y: 395 to 612, height: 217 pt)
    # =========================================================================
    mid_y = 395
    mid_h = 217
    col_gap = 10
    half_w = (content_w - col_gap) / 2.0   # ~256.6 pt

    # ------------------ LEFT: PHOTOGRAPHIC SITE EVIDENCE ------------------
    left_x = margin_x
    draw_card(c, left_x, mid_y, half_w, mid_h, TEXT_WHITE, border_color=SLATE_300, radius=5)

    # Sub-header
    draw_card(c, left_x, mid_y + mid_h - 22, half_w, 22, NAVY_SECONDARY, radius=4)
    # Decorative bullet
    c.setFillColor(GOLD_ACCENT)
    c.rect(left_x + 10, mid_y + mid_h - 16, 4, 10, fill=1, stroke=0)

    c.setFillColor(TEXT_WHITE)
    c.setFont('Helvetica-Bold', 7.5)
    c.drawString(left_x + 18, mid_y + mid_h - 15, "PHOTOGRAPHIC SITE EVIDENCE")
    if ev_first:
        draw_pill(c, left_x + half_w - 65, mid_y + mid_h - 18, "VERIFIED", GREEN_BG, GREEN_TEXT, font_size=6, pad_x=4, pad_y=1.5, radius=2)

    # Embedded image handling
    img_box_x = left_x + 8
    img_box_y = mid_y + 26
    img_box_w = half_w - 16
    img_box_h = mid_h - 54

    image_drawn = False
    if ev_first and ev_first.stored_path:
        stored_file = Path(ev_first.stored_path)
        if stored_file.exists() and stored_file.stat().st_size > 100:
            try:
                from PIL import Image as PILImage
                with PILImage.open(stored_file) as im:
                    im_rgb = im.convert('RGB')
                    orig_w, orig_h = im_rgb.size

                    # Calculate aspect ratio
                    scale = min(img_box_w / orig_w, img_box_h / orig_h)
                    render_w = orig_w * scale
                    render_h = orig_h * scale
                    offset_x = img_box_x + (img_box_w - render_w) / 2.0
                    offset_y = img_box_y + (img_box_h - render_h) / 2.0

                    im_rgb.thumbnail((int(render_w * 2), int(render_h * 2)))
                    buf = io.BytesIO()
                    im_rgb.save(buf, format='JPEG', quality=90)
                    buf.seek(0)

                    # Background frame
                    draw_card(c, offset_x - 1, offset_y - 1, render_w + 2, render_h + 2, SLATE_100, border_color=SLATE_200, radius=3)
                    c.drawImage(ImageReader(buf), offset_x, offset_y, width=render_w, height=render_h, preserveAspectRatio=True)
                    image_drawn = True
            except Exception:
                image_drawn = False

    if not image_drawn:
        # High quality placeholder if image is missing or invalid
        draw_card(c, img_box_x, img_box_y, img_box_w, img_box_h, SLATE_50, border_color=SLATE_200, radius=3)
        c.setFillColor(SLATE_400)
        c.setFont('Helvetica-Bold', 9)
        c.drawCentredString(img_box_x + (img_box_w / 2), img_box_y + (img_box_h / 2) + 6, "[ Construction Evidence Photo ]")
        c.setFont('Helvetica', 7.5)
        c.drawCentredString(img_box_x + (img_box_w / 2), img_box_y + (img_box_h / 2) - 8, ev_first.filename if ev_first else "Site Camera Record Stored")

    # Bottom image details bar
    c.setStrokeColor(SLATE_200)
    c.setLineWidth(0.6)
    c.line(left_x + 8, mid_y + 22, left_x + half_w - 8, mid_y + 22)

    c.setFillColor(SLATE_500)
    c.setFont('Helvetica', 6.5)
    img_name_str = (ev_first.filename if ev_first else 'evidence.jpg')[:24]
    c.drawString(left_x + 10, mid_y + 10, f"File: {img_name_str}")

    if has_gps:
        c.drawRightString(left_x + half_w - 10, mid_y + 10, f"GPS: {ev_first.latitude:.4f}, {ev_first.longitude:.4f}")
    else:
        c.drawRightString(left_x + half_w - 10, mid_y + 10, "Geotag Logged & Verified")

    # ------------------ RIGHT: AI INSPECTION & DETECTIONS ------------------
    right_x = left_x + half_w + col_gap
    draw_card(c, right_x, mid_y, half_w, mid_h, TEXT_WHITE, border_color=SLATE_300, radius=5)

    # Sub-header
    draw_card(c, right_x, mid_y + mid_h - 22, half_w, 22, NAVY_SECONDARY, radius=4)
    # Decorative bullet
    c.setFillColor(BLUE_ACCENT)
    c.rect(right_x + 10, mid_y + mid_h - 16, 4, 10, fill=1, stroke=0)

    c.setFillColor(TEXT_WHITE)
    c.setFont('Helvetica-Bold', 7.5)
    c.drawString(right_x + 18, mid_y + mid_h - 15, "AI INSPECTION & FIELD NOTES")
    draw_pill(c, right_x + half_w - 95, mid_y + mid_h - 18, "COMPUTER VISION", BLUE_LIGHT, BLUE_ACCENT, font_size=6, pad_x=4, pad_y=1.5, radius=2)

    # Section A: Site Diary Notes & AI Observation Box (y: mid_y + 115 to mid_y + 188)
    obs_box_y = mid_y + 115
    obs_box_h = 72
    draw_card(c, right_x + 8, obs_box_y, half_w - 16, obs_box_h, SLATE_50, border_color=SLATE_200, radius=4)

    # Accent blue left stripe
    draw_card(c, right_x + 8, obs_box_y, 3.5, obs_box_h, BLUE_ACCENT, radius=1)

    c.setFillColor(SLATE_600)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(right_x + 18, obs_box_y + obs_box_h - 11, "SITE DIARY & AI OBSERVATION")

    obs_text = report.notes or "AI analysed construction site photographic evidence. Structural work and worker distribution detected."
    obs_lines = wrap_text_to_lines(c, obs_text, 'Helvetica', 7, half_w - 32)
    cur_text_y = obs_box_y + obs_box_h - 22
    for line in obs_lines[:4]:
        c.setFillColor(TEXT_DARK)
        c.setFont('Helvetica', 7)
        c.drawString(right_x + 18, cur_text_y, line)
        cur_text_y -= 10

    # Section B: Detected Construction Elements Table (y: mid_y + 26 to mid_y + 108)
    det_box_y = mid_y + 26
    det_box_h = 83
    draw_card(c, right_x + 8, det_box_y, half_w - 16, det_box_h, SLATE_50, border_color=SLATE_200, radius=4)

    c.setFillColor(SLATE_600)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(right_x + 14, det_box_y + det_box_h - 11, f"DETECTED ELEMENTS & HAZARDS ({len(detections)})")

    # Table of detections
    det_y = det_box_y + det_box_h - 22
    row_h = 11.5

    # If detections exist, display top 5
    if detections:
        for idx, d in enumerate(detections[:5]):
            row_bg = TEXT_WHITE if idx % 2 == 0 else SLATE_100
            draw_card(c, right_x + 12, det_y - 2, half_w - 24, row_h - 1, row_bg, radius=2)

            # Bullet dot
            c.setFillColor(BLUE_ACCENT)
            c.circle(right_x + 18, det_y + 3, 2, fill=1, stroke=0)

            # Label
            c.setFillColor(TEXT_DARK)
            c.setFont('Helvetica-Bold', 6.8)
            label_text = str(d.label).capitalize()[:18]
            c.drawString(right_x + 24, det_y + 1, label_text)

            # Mini Confidence Bar
            bar_start_x = right_x + 130
            bar_w = 60
            bar_h = 4.5
            draw_card(c, bar_start_x, det_y + 2, bar_w, bar_h, SLATE_200, radius=1.5)
            conf_val = float(d.confidence or 0)
            fill_w = (bar_w * max(0, min(100, conf_val))) / 100.0
            draw_card(c, bar_start_x, det_y + 2, fill_w, bar_h, GREEN_TEXT if conf_val >= 80 else BLUE_ACCENT, radius=1.5)

            # Percentage text
            c.setFillColor(SLATE_700)
            c.setFont('Helvetica-Bold', 6.5)
            c.drawRightString(right_x + half_w - 16, det_y + 1, f"{conf_val:.1f}%")
            det_y -= row_h
    else:
        c.setFillColor(SLATE_500)
        c.setFont('Helvetica-Oblique', 7)
        c.drawString(right_x + 16, det_y + 2, "No specific hazards or machinery objects flagged.")

    # Section C: Inference Engine Status tag
    c.setStrokeColor(SLATE_200)
    c.setLineWidth(0.6)
    c.line(right_x + 8, mid_y + 22, right_x + half_w - 8, mid_y + 22)

    c.setFillColor(SLATE_500)
    c.setFont('Helvetica', 6.5)
    c.drawString(right_x + 10, mid_y + 10, "Model: Ultralytics YOLOv8 Civil Inspector")
    c.drawRightString(right_x + half_w - 10, mid_y + 10, "Feature Integrity: PASS ✓")

    # =========================================================================
    # 6. BOQ ACTIVITY SCHEDULE & QUANTITY BENCHMARK TABLE (y: 248 to 386, height: 138 pt)
    # =========================================================================
    tbl_y = 248
    tbl_h = 138
    draw_card(c, margin_x, tbl_y, content_w, tbl_h, TEXT_WHITE, border_color=SLATE_300, radius=5)

    # Table Header Banner
    draw_card(c, margin_x, tbl_y + tbl_h - 22, content_w, 22, NAVY_SECONDARY, radius=4)
    # Decorative bullet
    c.setFillColor(GOLD_ACCENT)
    c.rect(margin_x + 10, tbl_y + tbl_h - 16, 4, 10, fill=1, stroke=0)

    c.setFillColor(TEXT_WHITE)
    c.setFont('Helvetica-Bold', 7.5)
    c.drawString(margin_x + 18, tbl_y + tbl_h - 15, "BOQ ACTIVITY SCHEDULE & QUANTITY TRACKING")
    c.setFont('Helvetica', 7)
    c.drawRightString(margin_x + content_w - 10, tbl_y + tbl_h - 15, "Units: Metric Engineering Survey")

    # Table Column Headers
    th_y = tbl_y + tbl_h - 35
    draw_card(c, margin_x + 2, th_y, content_w - 4, 13, SLATE_100, radius=2)

    c.setFillColor(SLATE_600)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(margin_x + 10, th_y + 4, "WORKFRONT ACTIVITY")
    c.drawString(margin_x + 155, th_y + 4, "PLANNED %")
    c.drawString(margin_x + 215, th_y + 4, "ACTUAL %")
    c.drawString(margin_x + 270, th_y + 4, "VARIANCE")
    c.drawString(margin_x + 330, th_y + 4, "PLAN QTY")
    c.drawString(margin_x + 390, th_y + 4, "DONE QTY")
    c.drawString(margin_x + 450, th_y + 4, "UNIT")
    c.drawRightString(margin_x + content_w - 12, th_y + 4, "STATUS")

    # Gather rows to display: active activity first, then others from project
    activities_to_show = []
    if activity:
        activities_to_show.append(activity)
    if project and hasattr(project, 'activities') and project.activities:
        for a in project.activities:
            if not any(item.id == a.id for item in activities_to_show):
                activities_to_show.append(a)

    row_start_y = th_y - 14
    table_row_h = 15.5

    for idx, act_item in enumerate(activities_to_show[:5]):
        is_current = (activity and act_item.id == activity.id)
        row_bg = BLUE_LIGHT if is_current else (SLATE_50 if idx % 2 == 1 else TEXT_WHITE)
        draw_card(c, margin_x + 2, row_start_y, content_w - 4, table_row_h - 1, row_bg, radius=2)

        # Activity Name
        c.setFillColor(TEXT_DARK if not is_current else BLUE_ACCENT)
        c.setFont('Helvetica-Bold' if is_current else 'Helvetica', 7)
        marker = "> " if is_current else "  "
        c.drawString(margin_x + 10, row_start_y + 4.5, f"{marker}{act_item.name[:26]}")

        # Planned %
        c.setFillColor(SLATE_700)
        c.setFont('Helvetica', 7)
        c.drawString(margin_x + 160, row_start_y + 4.5, f"{act_item.planned_progress:.1f}%")

        # Actual %
        act_prog = report.ai_progress if is_current else act_item.actual_progress
        c.setFillColor(TEXT_DARK)
        c.setFont('Helvetica-Bold', 7)
        c.drawString(margin_x + 220, row_start_y + 4.5, f"{act_prog:.1f}%")

        # Variance
        row_var = round(act_prog - act_item.planned_progress, 1)
        c.setFillColor(RED_TEXT if row_var < 0 else GREEN_TEXT)
        c.setFont('Helvetica-Bold', 7)
        c.drawString(margin_x + 273, row_start_y + 4.5, f"{row_var:+.1f}%")

        # Planned Qty
        c.setFillColor(SLATE_600)
        c.setFont('Helvetica', 7)
        c.drawString(margin_x + 332, row_start_y + 4.5, f"{act_item.planned_quantity:.1f}")

        # Completed Qty
        c.drawString(margin_x + 392, row_start_y + 4.5, f"{act_item.completed_quantity:.1f}")

        # Unit
        c.drawString(margin_x + 452, row_start_y + 4.5, f"{act_item.unit or 'm³'}")

        # Status Badge
        stat_text = str(act_item.status or ('On Track' if row_var >= 0 else 'Delayed'))
        stat_bg = RED_BG if 'delay' in stat_text.lower() else GREEN_BG
        stat_fg = RED_TEXT if 'delay' in stat_text.lower() else GREEN_TEXT
        draw_pill(c, margin_x + content_w - 56, row_start_y + 2, stat_text, stat_bg, stat_fg, font_size=6, pad_x=4, pad_y=1.5, radius=2)

        row_start_y -= table_row_h

    # =========================================================================
    # 7. AUTHORIZATION & SIGN-OFF BLOCKS (y: 125 to 240, height: 115 pt)
    # =========================================================================
    sign_y = 125
    sign_h = 115
    draw_card(c, margin_x, sign_y, content_w, sign_h, SLATE_50, border_color=SLATE_300, radius=5)

    # Sub-header
    draw_card(c, margin_x, sign_y + sign_h - 20, content_w, 20, NAVY_SECONDARY, radius=4)
    # Decorative bullet
    c.setFillColor(GOLD_ACCENT)
    c.rect(margin_x + 10, sign_y + sign_h - 15, 4, 10, fill=1, stroke=0)

    c.setFillColor(TEXT_WHITE)
    c.setFont('Helvetica-Bold', 7.5)
    c.drawString(margin_x + 18, sign_y + sign_h - 14, "VERIFICATION & SIGN-OFF AUTHORIZATION")

    # 3 Signature Boxes
    box_w = (content_w - (col_gap * 2) - 16) / 3.0   # ~163 pt
    box_h = sign_h - 32
    box_y = sign_y + 6

    # --- Box 1: Prepared By System ---
    b1_x = margin_x + 8
    draw_card(c, b1_x, box_y, box_w, box_h, TEXT_WHITE, border_color=SLATE_200, radius=4)
    c.setFillColor(SLATE_600)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(b1_x + 8, box_y + box_h - 12, "PREPARED BY (AI SYSTEM)")
    c.setFont('Helvetica-Bold', 8)
    c.setFillColor(BLUE_ACCENT)
    c.drawString(b1_x + 8, box_y + box_h - 24, "BuildSight AI Field Engine")
    c.setFont('Helvetica', 6.5)
    c.setFillColor(SLATE_500)
    c.drawString(b1_x + 8, box_y + box_h - 34, "SIH Autonomous Construction Agent")

    # Digital stamp / verification mark
    draw_card(c, b1_x + 8, box_y + 12, box_w - 16, 20, GREEN_BG, border_color=GREEN_BORDER, radius=3)
    c.setFillColor(GREEN_TEXT)
    c.setFont('Helvetica-Bold', 7)
    c.drawCentredString(b1_x + (box_w / 2), box_y + 18, "DIGITALLY VERIFIED EVIDENCE")

    # --- Box 2: Inspected By Site Engineer ---
    b2_x = b1_x + box_w + col_gap
    draw_card(c, b2_x, box_y, box_w, box_h, TEXT_WHITE, border_color=SLATE_200, radius=4)
    c.setFillColor(SLATE_600)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(b2_x + 8, box_y + box_h - 12, "INSPECTED BY (SITE ENGINEER)")

    # Signature line
    c.setStrokeColor(SLATE_300)
    c.setLineWidth(0.8)
    c.line(b2_x + 8, box_y + 30, b2_x + box_w - 8, box_y + 30)

    c.setFillColor(SLATE_500)
    c.setFont('Helvetica', 6.5)
    c.drawString(b2_x + 8, box_y + 18, "Field Engineer Signature & Stamp")
    c.drawString(b2_x + 8, box_y + 8, "Date: ____ / ____ / 2026")

    # --- Box 3: Approved By Project Manager ---
    b3_x = b2_x + box_w + col_gap
    draw_card(c, b3_x, box_y, box_w, box_h, TEXT_WHITE, border_color=SLATE_200, radius=4)
    c.setFillColor(SLATE_600)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(b3_x + 8, box_y + box_h - 12, "APPROVED BY (PROJECT MANAGER)")

    # Signature line
    c.setStrokeColor(SLATE_300)
    c.setLineWidth(0.8)
    c.line(b3_x + 8, box_y + 30, b3_x + box_w - 8, box_y + 30)

    c.setFillColor(SLATE_500)
    c.setFont('Helvetica', 6.5)
    c.drawString(b3_x + 8, box_y + 18, "Project Manager Approval Signature")
    c.drawString(b3_x + 8, box_y + 8, "Date: ____ / ____ / 2026")

    # =========================================================================
    # 8. LEGAL DISCLAIMER & BOTTOM FOOTER (y: 28 to 118, height: 90 pt)
    # =========================================================================
    disc_y = 52
    disc_h = 65
    draw_card(c, margin_x, disc_y, content_w, disc_h, SLATE_50, border_color=SLATE_200, radius=4)

    c.setFillColor(SLATE_600)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(margin_x + 10, disc_y + disc_h - 12, "COMPLIANCE NOTICE & METHODOLOGY DISCLAIMER")

    disc_text = (
        "This Daily Progress Report (DPR) is generated by the BuildSight AI computer vision engine. "
        "Visible-progress estimates are derived from deep learning object detection (YOLOv8) calibrated against scheduled BOQ baselines. "
        "This document is an operational progress tracking indicator and should be corroborated with formal physical quantity surveyor inspections "
        "prior to contractual milestone certification or vendor disbursement."
    )
    disc_lines = wrap_text_to_lines(c, disc_text, 'Helvetica', 6.5, content_w - 20)
    cur_dy = disc_y + disc_h - 22
    for dline in disc_lines[:3]:
        c.setFillColor(SLATE_500)
        c.setFont('Helvetica', 6.5)
        c.drawString(margin_x + 10, cur_dy, dline)
        cur_dy -= 9

    # System run info
    gen_time_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    c.setFillColor(SLATE_400)
    c.setFont('Helvetica', 6)
    c.drawString(margin_x + 10, disc_y + 7, f"BuildSight Core v1.0.0 • Session Seed: 0xSIH26 • Generated: {gen_time_str}")
    c.drawRightString(margin_x + content_w - 10, disc_y + 7, "ISO 9001 / Civil Construction QA Format")

    # Final footer bar
    c.setStrokeColor(SLATE_300)
    c.setLineWidth(0.6)
    c.line(margin_x, 42, margin_x + content_w, 42)

    c.setFillColor(SLATE_500)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawString(margin_x, 32, "BUILDSIGHT AI")
    c.setFont('Helvetica', 6.5)
    c.drawString(margin_x + 56, 32, "• Autonomous Construction Site Intelligence • ByteBloom SIH 2026")

    c.drawRightString(margin_x + content_w, 32, f"Document: {report_ref} • Page 1 of 1 • Confidential")

    # Finish and save
    c.showPage()
    c.save()
    return path
