"""PDF bill generator for M Cube's Cafe matching the exact digital receipt card layout."""
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# Digital Receipt Exact Color Palette
DARK_TITLE = HexColor('#0F172A')      # Bold Title Text
MUTED_TEXT = HexColor('#64748B')      # Subtitles & Details
BORDER_DASH = HexColor('#CBD5E1')      # Dashed Divider Lines
BORDER_SOLID = HexColor('#E2E8F0')     # Table Dividers
TOTAL_BG = HexColor('#F8FAFC')         # Soft Total Pill Background
GREEN_TOTAL = HexColor('#15803D')      # Total Paid Price Color
GOLDEN_THANKYOU = HexColor('#D97706')  # Thank you text color
FOOTER_LIGHT = HexColor('#94A3B8')     # Small Note

styles = getSampleStyleSheet()

# Typography Styles matching Digital Receipt
title_style = ParagraphStyle(
    'ReceiptCafeTitle',
    parent=styles['Heading1'],
    textColor=DARK_TITLE,
    fontSize=22,
    fontName='Helvetica-Bold',
    alignment=TA_CENTER,
    spaceAfter=2,
)

subtitle_style = ParagraphStyle(
    'ReceiptSubtitle',
    parent=styles['Normal'],
    textColor=MUTED_TEXT,
    fontSize=9,
    alignment=TA_CENTER,
    spaceAfter=6,
)

meta_left_style = ParagraphStyle(
    'MetaLeft',
    parent=styles['Normal'],
    textColor=DARK_TITLE,
    fontSize=9,
    alignment=TA_LEFT,
)

meta_right_style = ParagraphStyle(
    'MetaRight',
    parent=styles['Normal'],
    textColor=DARK_TITLE,
    fontSize=9,
    alignment=TA_RIGHT,
)

table_th_left = ParagraphStyle(
    'TableTHLeft',
    parent=styles['Normal'],
    textColor=DARK_TITLE,
    fontSize=9,
    fontName='Helvetica-Bold',
    alignment=TA_LEFT,
)

table_th_center = ParagraphStyle(
    'TableTHCenter',
    parent=styles['Normal'],
    textColor=DARK_TITLE,
    fontSize=9,
    fontName='Helvetica-Bold',
    alignment=TA_CENTER,
)

table_th_right = ParagraphStyle(
    'TableTHRight',
    parent=styles['Normal'],
    textColor=DARK_TITLE,
    fontSize=9,
    fontName='Helvetica-Bold',
    alignment=TA_RIGHT,
)

cell_name_style = ParagraphStyle(
    'CellName',
    parent=styles['Normal'],
    textColor=DARK_TITLE,
    fontSize=9,
    alignment=TA_LEFT,
)

cell_qty_style = ParagraphStyle(
    'CellQty',
    parent=styles['Normal'],
    textColor=MUTED_TEXT,
    fontSize=9,
    alignment=TA_CENTER,
)

cell_amount_style = ParagraphStyle(
    'CellAmount',
    parent=styles['Normal'],
    textColor=DARK_TITLE,
    fontSize=9,
    alignment=TA_RIGHT,
)

total_label_style = ParagraphStyle(
    'TotalPaidLabel',
    parent=styles['Normal'],
    textColor=DARK_TITLE,
    fontSize=11,
    fontName='Helvetica-Bold',
    alignment=TA_LEFT,
)

total_val_style = ParagraphStyle(
    'TotalPaidVal',
    parent=styles['Normal'],
    textColor=GREEN_TOTAL,
    fontSize=13,
    fontName='Helvetica-Bold',
    alignment=TA_RIGHT,
)

thankyou_style = ParagraphStyle(
    'ThankYouText',
    parent=styles['Normal'],
    textColor=GOLDEN_THANKYOU,
    fontSize=10,
    fontName='Helvetica-Bold',
    alignment=TA_CENTER,
    spaceAfter=2,
)

footer_small_style = ParagraphStyle(
    'FooterSmall',
    parent=styles['Normal'],
    textColor=MUTED_TEXT,
    fontSize=8,
    alignment=TA_CENTER,
    spaceAfter=2,
)

footer_note_style = ParagraphStyle(
    'FooterNote',
    parent=styles['Normal'],
    textColor=FOOTER_LIGHT,
    fontSize=7,
    alignment=TA_CENTER,
)


def generate_bill_pdf(bill_data: dict) -> io.BytesIO:
    """
    Generate a PDF bill matching the EXACT digital receipt card design.
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        leftMargin=25 * mm,
        rightMargin=25 * mm,
    )

    elements = []
    page_width = A4[0] - 50 * mm  # Usable width for centered receipt box

    # ===== CAFE BRAND HEADER =====
    elements.append(Paragraph("M CUBE'S CAFE", title_style))
    elements.append(Paragraph("Quality Coffee, Quick Bites & Great Memories", subtitle_style))

    # Dashed Line Divider
    elements.append(HRFlowable(
        width="100%",
        thickness=1,
        color=BORDER_DASH,
        spaceBefore=4,
        spaceAfter=6,
        dash=(4, 3)
    ))

    # ===== INVOICE METADATA ROW =====
    order_id = bill_data.get('order_id', '')
    date_str = bill_data.get('date', '')
    payment_method = str(bill_data.get('payment_method', '')).upper()

    meta_data = [
        [
            Paragraph(f"<b>Invoice #:</b> MCUBE-{order_id}", meta_left_style),
            Paragraph(f"<b>Date:</b> {date_str}", meta_right_style),
        ]
    ]

    meta_table = Table(meta_data, colWidths=[page_width * 0.45, page_width * 0.55])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 4 * mm))

    # ===== ITEMS TABLE =====
    col_widths = [
        page_width * 0.60,  # Item Name
        page_width * 0.15,  # Qty
        page_width * 0.25,  # Amount
    ]

    table_rows = [
        [
            Paragraph("Item", table_th_left),
            Paragraph("Qty", table_th_center),
            Paragraph("Amount", table_th_right),
        ]
    ]

    items = bill_data.get('items', [])
    for item in items:
        name_val = item.get('name') or item.get('item_name') or ''
        qty_val = item.get('quantity', 1)
        subtotal_val = float(item.get('subtotal', 0))

        table_rows.append([
            Paragraph(name_val, cell_name_style),
            Paragraph(f"x{qty_val}", cell_qty_style),
            Paragraph(f"Rs. {subtotal_val:.2f}", cell_amount_style),
        ])

    items_table = Table(table_rows, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, 0), 0.75, BORDER_SOLID),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(items_table)

    # Dashed Line Divider
    elements.append(HRFlowable(
        width="100%",
        thickness=1,
        color=BORDER_DASH,
        spaceBefore=6,
        spaceAfter=6,
        dash=(4, 3)
    ))

    # ===== TOTAL PAID BLOCK =====
    total_val = float(bill_data.get('total') or bill_data.get('total_amount') or 0)
    total_label_text = f"Total Paid ({payment_method})" if payment_method else "Total Paid"

    total_data = [
        [
            Paragraph(f"<b>{total_label_text}</b>", total_label_style),
            Paragraph(f"<b>Rs. {total_val:.2f}</b>", total_val_style),
        ]
    ]

    total_table = Table(total_data, colWidths=[page_width * 0.60, page_width * 0.40])
    total_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TOTAL_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_SOLID),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 6 * mm))

    # ===== FOOTER RECEIPT MESSAGE =====
    elements.append(Paragraph("✨ Thank you for visiting M Cube's Cafe! ✨", thankyou_style))
    elements.append(Paragraph("Please present this receipt at the counter if required.", footer_small_style))
    elements.append(Paragraph("📍 Near Bharathiyar University, Coimbatore - 641046 | 📱 +91-9876543210", footer_small_style))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph("<i>This is a computer-generated bill receipt. No signature required.</i>", footer_note_style))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
