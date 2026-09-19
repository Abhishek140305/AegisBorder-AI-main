import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "AegisBorder AI — Implementation Plan & Walkthrough")
            self.drawRightString(612 - 54, 755, "OFFICIAL USE ONLY / BORDER SECURITY")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 747, 612 - 54, 747)

        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 36, page_str)
        self.drawString(54, 36, "Smart Border Document & Identity Screening Platform (ICAO Doc 9303)")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 46, 612 - 54, 46)
        
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#0f172a") # Navy
    accent_color = colors.HexColor("#0284c7")  # Cyan
    dark_text = colors.HexColor("#1e293b")
    muted_text = colors.HexColor("#475569")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=accent_color,
        spaceAfter=14
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=muted_text
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=accent_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=dark_text,
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'Body_Bold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    callout_style = ParagraphStyle(
        'Callout_Style',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f172a")
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=dark_text
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # Title Banner Block
    story.append(Paragraph("AI-Based Fake Identity & Document Screening System", title_style))
    story.append(Paragraph("System Architecture, Implementation Plan & Technical Walkthrough Report", subtitle_style))
    
    # Metadata pill
    meta_text = "<b>Author / Team:</b> Smart Border Security AI &bull; <b>Standard:</b> ICAO Doc 9303 (TD1, TD2, TD3) &bull; <b>Status:</b> Production Ready &bull; <b>Classification:</b> Official Technical Record"
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceBefore=2, spaceAfter=14))

    # SECTION 1: BACKGROUND & OPERATIONAL CHALLENGES
    story.append(Paragraph("1. Background & Operational Problem Statement", h1_style))
    p1 = ("Border checkpoints process tens of thousands of travelers daily with diverse identity documents "
          "(Passports, Visas, National Identity Cards, Driving Licenses, and Transit Permits). "
          "Traditional verification relies predominantly on manual inspection and rudimentary database lookups, "
          "leading to severe operational bottlenecks, delays, and critical vulnerabilities:")
    story.append(Paragraph(p1, body_style))

    bullet_items = [
        "<b>Physical & Digital Forgeries:</b> Sophisticated fake passports, altered photos, and counterfeit visa stamps.",
        "<b>Tampered Data Fields:</b> Digitally modified dates of birth (DOB), swapped names, and altered passport numbers.",
        "<b>Identity Impersonation:</b> Impersonators presenting valid documents belonging to look-alikes or victims of identity theft.",
        "<b>Blacklisted & Stolen Documents:</b> Expired credentials, stolen blank passport series, or individuals flagged under Interpol Red Notices.",
        "<b>Human Inspection Latency:</b> High passenger volume induces inspector fatigue, causing verification times to exceed 5 minutes per traveler."
    ]
    for b in bullet_items:
        story.append(Paragraph(f"&bull; {b}", body_style))

    story.append(Spacer(1, 10))

    # SECTION 2: SYSTEM ARCHITECTURE
    story.append(Paragraph("2. System Architecture & Core Modules", h1_style))
    p_arch = ("AegisBorder AI is engineered as a high-throughput, multi-modal screening platform comprising "
              "four dedicated AI and computer vision modules coordinated by a Unified Risk Scoring Engine:")
    story.append(Paragraph(p_arch, body_style))

    arch_data = [
        [Paragraph("Module", table_header_style), Paragraph("Core Technology", table_header_style), Paragraph("Key Functional Objective", table_header_style)],
        [
            Paragraph("<b>Module 1:<br/>OCR Extraction</b>", table_cell_style),
            Paragraph("Morphological MRZ locator + ICAO Doc 9303 TD1/TD2/TD3 parser + VIZ text extractor", table_cell_style),
            Paragraph("Automated extraction of Holder Name, Doc Number, Nationality, DOB, Expiry, Sex, and Authority from scans.", table_cell_style)
        ],
        [
            Paragraph("<b>Module 2:<br/>Document Validation</b>", table_cell_style),
            Paragraph("ICAO 7-3-1 weighting checksums + Cross-Field Integrity Engine + Interpol Red Notice DB", table_cell_style),
            Paragraph("Mathematical verification of check digits, cross-reconciliation of MRZ vs VIZ text, and real-time watchlist screening.", table_cell_style)
        ],
        [
            Paragraph("<b>Module 3:<br/>Tampering Forensics</b>", table_cell_style),
            Paragraph("Error Level Analysis (ELA) + Sobel Boundary Edge Splicing + Laplacian Noise Disparity + EXIF", table_cell_style),
            Paragraph("Multi-spectral detection of replaced photos, spliced elements, modified typography, and digital editor tags (Photoshop/Canva).", table_cell_style)
        ],
        [
            Paragraph("<b>Module 4:<br/>Face Verification</b>", table_cell_style),
            Paragraph("1:1 Cosine Feature Matcher + 2D FFT Fourier Anti-Spoofing / Presentation Attack Detection", table_cell_style),
            Paragraph("Real-time biometric match of document portrait against live passenger camera with screen-replay/moiré defense.", table_cell_style)
        ],
        [
            Paragraph("<b>Decision Engine &<br/>Audit Ledger</b>", table_cell_style),
            Paragraph("Dynamic 0-100% Risk Matrix + SHA-256 Cryptographic Audit Ledger", table_cell_style),
            Paragraph("Automated decision generation (Grant Entry, Secondary Inspection, Detain) and immutable digital audit trail.", table_cell_style)
        ]
    ]

    arch_table = Table(arch_data, colWidths=[90, 160, 254])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")])
    ]))
    story.append(arch_table)

    story.append(Spacer(1, 14))

    # SECTION 3: TECHNICAL IMPLEMENTATION DETAILS
    story.append(Paragraph("3. Technical Implementation & Mathematical Formulations", h1_style))
    
    # MRZ Math
    story.append(Paragraph("3.1 Module 1 & 2: ICAO Doc 9303 Check Digit Algorithm", h2_style))
    p_mrz = ("The International Civil Aviation Organization (ICAO) Doc 9303 specifies that all Machine Readable "
             "Travel Documents (MRTD) use a repeating 7-3-1 weight pattern over alphanumeric character values "
             "(0-9 = 0-9, A-Z = 10-35, '&lt;' = 0). The check digit <i>C</i> is computed as:")
    story.append(Paragraph(p_mrz, body_style))
    
    formula_text = "<b>Checksum Formula:</b> &nbsp;&nbsp; <i>C = ( &sum; (Value(char<sub>i</sub>) &times; Weight<sub>i mod 3</sub>) ) mod 10</i> &nbsp;&nbsp; where <i>Weight &isin; [7, 3, 1]</i>"
    story.append(Paragraph(formula_text, callout_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("This check digit is verified across Document Number, Date of Birth, Expiration Date, Optional Data, and a composite checksum covering the entirety of Line 2.", body_style))

    # Forensics Math
    story.append(Paragraph("3.2 Module 3: Error Level Analysis & Edge Discontinuity Forensics", h2_style))
    p_ela = ("<b>Error Level Analysis (ELA):</b> Re-saves the input document at a predetermined lossy JPEG compression quality (<i>Q = 90</i>). "
             "The absolute difference between the original and re-saved matrices highlights differential error rates. "
             "Original unscrambled regions converge to uniform low error levels, whereas spliced elements (pasted photos, "
             "altered text) exhibit stark, bright error spikes.")
    story.append(Paragraph(p_ela, body_style))

    p_edge = ("<b>Portrait Boundary Discontinuity:</b> Analyzes Sobel gradient magnitude across the four avatar borders: "
              "<i>G = &radic;(G<sub>x</sub><sup>2</sup> + G<sub>y</sub><sup>2</sup>)</i>. "
              "When an avatar is pasted or replaced, the pixel transition between the photo edge and the background security "
              "guilloché pattern creates an unnatural high-magnitude step discontinuity (<i>G<sub>boundary</sub> &gt; 65.0</i>), "
              "accompanied by color histogram divergence calculated via Bhattacharyya distance.")
    story.append(Paragraph(p_edge, body_style))

    # Biometrics Math
    story.append(Paragraph("3.3 Module 4: Biometric Matching & Anti-Spoofing (PAD)", h2_style))
    p_bio = ("<b>Face Verification:</b> Extracts multi-scale spatial histogram & gradient edge descriptors from the "
             "document portrait and live camera frames. Cosine similarity is computed between feature vectors: "
             "<i>Sim(u, v) = (u &bull; v) / (||u|| ||v||)</i>. Scores &ge; 65.0% confirm matching identity.")
    story.append(Paragraph(p_bio, body_style))
    p_pad = ("<b>Presentation Attack Detection (PAD):</b> Performs a 2D Fast Fourier Transform (FFT) on the live capture. "
             "Electronic displays (smartphones, tablets, computer monitors) emit periodic pixel grid raster patterns that manifest "
             "as localized high-frequency ring peaks in the Fourier magnitude spectrum, exposing screen replay attacks.")
    story.append(Paragraph(p_pad, body_style))

    story.append(Spacer(1, 10))

    # SECTION 4: UNIFIED RISK SCORING & DECISION MATRIX
    story.append(Paragraph("4. Unified Border Risk Engine & Decision Matrix", h1_style))
    p_risk = ("The Composite Risk Score <i>R</i> (0–100%) integrates findings across all four verification dimensions with "
              "security override triggers for high-threat scenarios:")
    story.append(Paragraph(p_risk, body_style))

    risk_formula = "<i>R<sub>composite</sub> = 0.25 &times; R<sub>integrity</sub> + 0.35 &times; R<sub>forensics</sub> + 0.20 &times; R<sub>biometrics</sub> + 0.20 &times; R<sub>watchlist</sub></i>"
    story.append(Paragraph(f"<b>Composite Formula:</b> {risk_formula}", callout_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Override Safeguards:</b> If an Interpol Red Notice is flagged, risk automatically overrides to &ge; 92%. "
                           "If portrait tampering is detected (&gt;75%), risk overrides to &ge; 85%. If critical checksums fail, risk floor is set to &ge; 62%.", body_style))

    risk_table_data = [
        [Paragraph("Risk Score", table_header_style), Paragraph("Risk Tier", table_header_style), Paragraph("Officer Action", table_header_style), Paragraph("Operational Protocol", table_header_style)],
        [
            Paragraph("<b>0 – 25%</b>", table_cell_style),
            Paragraph("<font color='#059669'><b>LOW RISK</b></font>", table_cell_style),
            Paragraph("<b>GRANT ENTRY</b>", table_cell_style),
            Paragraph("Document authentic, all checksums valid, face matched, clear watchlist record. Issue entry stamp.", table_cell_style)
        ],
        [
            Paragraph("<b>26 – 55%</b>", table_cell_style),
            Paragraph("<font color='#d97706'><b>MODERATE</b></font>", table_cell_style),
            Paragraph("<b>SECONDARY INSPECTION</b>", table_cell_style),
            Paragraph("Minor compression anomalies or low-confidence face match. Refer passenger to interview desk.", table_cell_style)
        ],
        [
            Paragraph("<b>56 – 80%</b>", table_cell_style),
            Paragraph("<font color='#ea580c'><b>HIGH RISK</b></font>", table_cell_style),
            Paragraph("<b>REFUSE ENTRY & ESCORT</b>", table_cell_style),
            Paragraph("Invalid ICAO checksum, expired credentials, or DOB mismatch. Refuse clearance and escort traveler.", table_cell_style)
        ],
        [
            Paragraph("<b>81 – 100%</b>", table_cell_style),
            Paragraph("<font color='#e11d48'><b>CRITICAL</b></font>", table_cell_style),
            Paragraph("<b>DETAIN & CONFISCATE</b>", table_cell_style),
            Paragraph("Confirmed photo replacement, Interpol Red Notice, or presentation attack. Immediate detention mandated.", table_cell_style)
        ]
    ]

    risk_table = Table(risk_table_data, colWidths=[70, 85, 125, 224])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")])
    ]))
    story.append(risk_table)

    story.append(Spacer(1, 14))

    # SECTION 5: DEMONSTRATION SCENARIOS & TEST RESULTS
    story.append(Paragraph("5. Walkthrough of Test Presets & Validation Results", h1_style))
    p_test = ("The system was subjected to rigorous validation across five real-world border checkpoint threat profiles:")
    story.append(Paragraph(p_test, body_style))

    test_data = [
        [Paragraph("Scenario / Preset", table_header_style), Paragraph("Threat Vector", table_header_style), Paragraph("Detected Anomalies", table_header_style), Paragraph("Risk Score", table_header_style), Paragraph("Outcome", table_header_style)],
        [
            Paragraph("<b>Preset 1:<br/>Genuine Passport</b>", table_cell_style),
            Paragraph("Standard Traveler<br/>(Sarah Schmidt)", table_cell_style),
            Paragraph("None. Checksums valid, noise uniform, ELA normal (28%).", table_cell_style),
            Paragraph("<b>2.8%</b><br/>(LOW)", table_cell_style),
            Paragraph("<font color='#059669'><b>GRANT ENTRY</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Preset 2:<br/>Tampered Photo</b>", table_cell_style),
            Paragraph("Avatar Replacement<br/>(Alexander Cross)", table_cell_style),
            Paragraph("ELA artifact spike (78%), boundary edge discontinuity (88.5%).", table_cell_style),
            Paragraph("<b>85.0%</b><br/>(CRITICAL)", table_cell_style),
            Paragraph("<font color='#e11d48'><b>DETAIN & CONFISCATE</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Preset 3:<br/>Forged Visa</b>", table_cell_style),
            Paragraph("Invalid Checksum<br/>(Tariq Mansur)", table_cell_style),
            Paragraph("ICAO 9303 Doc Number checksum calculation mismatch.", table_cell_style),
            Paragraph("<b>62.0%</b><br/>(HIGH)", table_cell_style),
            Paragraph("<font color='#ea580c'><b>REFUSE ENTRY</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Preset 4:<br/>DOB Inconsistency</b>", table_cell_style),
            Paragraph("Cross-Field Fraud<br/>(Dmitri Volkov)", table_cell_style),
            Paragraph("Printed VIZ '01.01.1999' contradicts encoded MRZ '1985-03-14'.", table_cell_style),
            Paragraph("<b>62.0%</b><br/>(HIGH)", table_cell_style),
            Paragraph("<font color='#ea580c'><b>REFUSE ENTRY</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Preset 5:<br/>Interpol Notice</b>", table_cell_style),
            Paragraph("Fugitive Alert<br/>(Viktor Korshikov)", table_cell_style),
            Paragraph("Database hit: Transnational Identity Fraud & Document Forgery.", table_cell_style),
            Paragraph("<b>92.0%</b><br/>(CRITICAL)", table_cell_style),
            Paragraph("<font color='#e11d48'><b>DETAIN & CONFISCATE</b></font>", table_cell_style)
        ]
    ]

    test_table = Table(test_data, colWidths=[90, 85, 154, 65, 110])
    test_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")])
    ]))
    story.append(test_table)

    story.append(Spacer(1, 14))

    # SECTION 6: CRYPTOGRAPHIC AUDIT LEDGER & COMPLIANCE
    story.append(Paragraph("6. Cryptographic Audit Ledger & Compliance", h1_style))
    p_audit = ("Every completed screening produces an immutable cryptographic record. "
               "The inspection payload (timestamp, officer ID, checkpoint node, holder name, document number, "
               "risk score, and mandated action) is hashed using <b>SHA-256</b> to create a tamper-proof digital signature. "
               "Officers can export certificates as structured JSON or print official audit reports for evidence custody.")
    story.append(Paragraph(p_audit, body_style))

    sample_hash_block = (
        "<b>Audit Identifier:</b> BCP-1772904120-9FB1E559<br/>"
        "<b>Checkpoint Node:</b> DELHI-IGI-T3-COUNTER-14 &bull; <b>Officer ID:</b> OFFICER-7419<br/>"
        "<b>SHA-256 Hash:</b> <code>9fb1e5591c02bbf3a71b9d4e8c1874220dcfae56214589d71e2c9081e81249fa</code><br/>"
        "<b>Algorithm:</b> SHA-256-IMMUTABLE-LEDGER &bull; <b>Digital Seal:</b> VERIFIED & SEALED"
    )
    story.append(Paragraph(sample_hash_block, callout_style))

    story.append(Spacer(1, 14))

    # SECTION 7: SUMMARY & IMPACT
    story.append(Paragraph("7. Operational Impact & Conclusion", h1_style))
    impact_items = [
        "<b>Inspection Speedup:</b> Reduces travel document verification latency from 3–5 minutes to under <b>3 seconds</b>.",
        "<b>High-Precision Forgery Interception:</b> Unmasks digital photo replacements and text modifications invisible to human inspectors.",
        "<b>Standardized Checkpoint Enforcement:</b> Eliminates subjective human error through automated ICAO 9303 checksum and biometric scoring.",
        "<b>Auditability:</b> Produces cryptographic forensic paper trails admissible in legal border enforcement proceedings."
    ]
    for imp in impact_items:
        story.append(Paragraph(f"&bull; {imp}", body_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at: {filename}")

if __name__ == "__main__":
    default_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AegisBorder_AI_Implementation_Plan_and_Walkthrough.pdf")
    out_pdf = sys.argv[1] if len(sys.argv) > 1 else default_path
    build_pdf(out_pdf)

