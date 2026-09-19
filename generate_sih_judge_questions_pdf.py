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
    """Two-pass canvas for dynamic total page count and professional running headers/footers"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0284c7"))

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "SIH 2026 TECHNICAL DEFENSE QUESTION BANK  |  AEGISBORDER AI (SIH26188)")
            self.drawRightString(612 - 54, 755, "STRICT JUDGE EVALUATION MANUAL")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(54, 747, 612 - 54, 747)

        # Running Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 34, page_str)
        self.drawString(54, 34, "Smart India Hackathon 2026 • Problem Statement SIH26188 • Team: The Deciders • Confidential")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.6)
        self.line(54, 44, 612 - 54, 44)
        
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

    c_primary = colors.HexColor("#09101f")   # Deep navy
    c_accent = colors.HexColor("#0284c7")    # Cyber cyan
    c_emerald = colors.HexColor("#059669")   # Success green
    c_rose = colors.HexColor("#e11d48")      # Threat red
    c_amber = colors.HexColor("#d97706")     # Caution amber
    c_dark = colors.HexColor("#1e293b")      # Text dark
    c_muted = colors.HexColor("#475569")     # Text muted
    c_border = colors.HexColor("#cbd5e1")    # Border gray
    c_card_bg = colors.HexColor("#f8fafc")   # Card background

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14.5,
        textColor=c_accent,
        spaceAfter=6
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=12,
        textColor=c_muted
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=5,
        keepWithNext=True
    )

    round_title_style = ParagraphStyle(
        'RoundTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13.5,
        textColor=c_accent,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    q_style = ParagraphStyle(
        'QuestionStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11.5,
        textColor=c_primary,
        spaceBefore=3,
        spaceAfter=1
    )

    attack_style = ParagraphStyle(
        'AttackStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10.5,
        textColor=c_rose,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=c_dark,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=c_dark
    )

    story = []

    def make_callout(text, bg_color="#f0f9ff", border_color="#0284c7"):
        p = Paragraph(text, body_style)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_color)),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor(border_color)),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        return t

    # ═════════════════════════════════════════════════════════════════
    # HEADER BANNER
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("⚖️ SIH 2026: AegisBorder AI — Strict Judge Question Bank", title_style))
    story.append(Paragraph("Comprehensive Technical Defense, Code Cross-Examination & Vulnerability Audit", subtitle_style))
    
    meta_info = (
        "<b>Problem Statement:</b> SIH26188 &bull; <b>Team:</b> The Deciders &bull; "
        "<b>Project:</b> AegisBorder AI &bull; <b>Repo:</b> https://github.com/Jishnu09-siuu/AegisBorder-AI.git &bull; "
        "<b>Live Demo:</b> https://rakshak-ai-omega-wheat.vercel.app/"
    )
    story.append(Paragraph(meta_info, meta_style))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=2, spaceAfter=6))

    intro_box = (
        "<b>⚠️ PURPOSE OF THIS DOCUMENT:</b> This manual simulates the exact inquiries, cross-examinations, "
        "and architectural stress-tests that a senior SIH technical jury will impose on your team. "
        "It exposes discrepancies between pitch claims and source code reality, providing the exact questions "
        "and judge trap-points across all 17 defense dimensions."
    )
    story.append(make_callout(intro_box, "#fef2f2", "#e11d48"))
    story.append(Spacer(1, 6))

    # ═════════════════════════════════════════════════════════════════
    # CLAIMS AUDIT TABLE
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. Codebase Reality vs. Marketing Claim Verification Audit", h1_style))
    audit_data = [
        [Paragraph("Stated Pitch Claim", table_header_style), Paragraph("Source Code Implementation", table_header_style), Paragraph("Verdict", table_header_style), Paragraph("Judge Cross-Examination Trap", table_header_style)],
        [
            Paragraph("<b>Deep Learning 128-d Face Vectors</b>", table_cell_style),
            Paragraph("<code>compute_face_feature_vector</code> in <code>face_verifier.py</code> computes spatial 8&times;8 intensity histograms (1024) + Sobel gradient magnitudes (256).", table_cell_style),
            Paragraph("<font color='#d97706'><b>Heuristic Only</b></font>", table_cell_style),
            Paragraph("'Which neural net produced your 128-d embeddings? You aren't using FaceNet or ArcFace; you are using a classical Sobel/intensity histogram.'", table_cell_style)
        ],
        [
            Paragraph("<b>Live Interpol Red Notice Query</b>", table_cell_style),
            Paragraph("<code>watchlist_db.py</code> has a static in-memory dictionary <code>KNOWN_WATCHLIST</code> with 3 seeded records.", table_cell_style),
            Paragraph("<font color='#e11d48'><b>Simulated</b></font>", table_cell_style),
            Paragraph("'Did Interpol actually issue you an API token? What is your failover when the external government network drops?'", table_cell_style)
        ],
        [
            Paragraph("<b>Bayesian Risk Scoring Engine</b>", table_cell_style),
            Paragraph("<code>risk_engine.py</code> uses linear weighted sums (30-25-25-20) with hardcoded heuristic risk floors.", table_cell_style),
            Paragraph("<font color='#d97706'><b>Rule-Based</b></font>", table_cell_style),
            Paragraph("'Where are the prior probabilities and conditional likelihood distributions? This is a weighted average, not Bayes rule.'", table_cell_style)
        ],
        [
            Paragraph("<b>ICAO 9303 7-3-1 Checksum Math</b>", table_cell_style),
            Paragraph("<code>mrz_parser.py</code> implements the full mod10 7-3-1 algorithm for TD1, TD2, and TD3 specifications.", table_cell_style),
            Paragraph("<font color='#059669'><b>Fully Verified</b></font>", table_cell_style),
            Paragraph("'If a criminal manufactures a fake passport with mathematically correct checksums, does your MRZ module catch it?'", table_cell_style)
        ],
        [
            Paragraph("<b>Error Level Analysis (ELA)</b>", table_cell_style),
            Paragraph("<code>ela.py</code> re-saves image at 90% JPEG quality, subtracts difference, and scales deltas.", table_cell_style),
            Paragraph("<font color='#059669'><b>Fully Verified</b></font>", table_cell_style),
            Paragraph("'What happens if the forged passport was uniformly re-compressed as a whole? Doesn't ELA fail completely?'", table_cell_style)
        ],
        [
            Paragraph("<b>Sub-1.2 Second Screening Latency</b>", table_cell_style),
            Paragraph("Measured on local fast multi-core machine without network round-trip overhead.", table_cell_style),
            Paragraph("<font color='#d97706'><b>Conditional</b></font>", table_cell_style),
            Paragraph("'On Vercel serverless with a cold start, your Python function takes 3–6 seconds. How did you benchmark 1.2s?'", table_cell_style)
        ],
    ]
    t_audit = Table(audit_data, colWidths=[110, 150, 74, 170])
    t_audit.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg])
    ]))
    story.append(t_audit)
    story.append(Spacer(1, 8))

    # ═════════════════════════════════════════════════════════════════
    # ALL 17 ROUNDS OF QUESTIONS
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. Complete 17-Round Technical Examination Question Bank", h1_style))

    rounds = [
        ("ROUND 1: PROJECT FUNDAMENTALS & ELEVATOR PITCH", [
            ("Q1.1", "Explain AegisBorder AI in exactly 30 seconds as if you are presenting to the national jury.",
             "Judge Focus: Conciseness, eliminating fluff, stating the exact input, throughput, and output."),
            ("Q1.2", "What exact problem are you solving that commercial e-Gates (like SITA or Vision-Box) haven't already solved?",
             "Judge Focus: Identifying the exact technical differentiator without sounding generic."),
            ("Q1.3", "Who is the primary operational user of this dashboard: the passenger, the border guard, or immigration intelligence?",
             "Judge Focus: Assessing operational workflow realism and human-in-the-loop design."),
            ("Q1.4", "What is the exact mathematical input to your system and what is the exact output structure?",
             "Judge Focus: Verifying data contract understanding (Base64 JPEG + JSON metadata -> 0-100 score + JSON audit)."),
        ]),
        ("ROUND 2: TECHNICAL ARCHITECTURE & END-TO-END FLOW", [
            ("Q2.1", "Walk me step-by-step through what happens under the hood from the millisecond a passport is scanned to when the risk gauge renders.",
             "Judge Focus: Traceability from React state -> Vite proxy -> FastAPI endpoint -> OpenCV pipeline -> response parsing."),
            ("Q2.2", "In which file and function does the FastAPI backend receive the uploaded document image?",
             "Judge Focus: Direct code knowledge: `backend/main.py` -> `@app.post('/api/screen-document')` -> `screen_document()`."),
            ("Q2.3", "How are you avoiding memory leaks in OpenCV when processing high-resolution passenger scans concurrently?",
             "Judge Focus: Handling numpy memory allocation, garbage collection, and PIL image buffer release."),
            ("Q2.4", "Your frontend runs on Vercel Edge and proxies to a Python serverless function via `vercel.json`. What happens when Vercel hits its 1024MB memory limit during SciPy edge transforms?",
             "Judge Focus: Understanding production deployment constraints and serverless memory ceiling."),
        ]),
        ("ROUND 3: ICAO DOC 9303 & MRZ CHECKSUM MATHEMATICS", [
            ("Q3.1", "Explain the 7-3-1 weighting algorithm mathematically. Why were 7, 3, and 1 chosen by ICAO instead of sequential weights?",
             "Judge Focus: Cryptographic and mathematical properties: coprime weights with base 10 minimize transposition error propagation."),
            ("Q3.2", "Calculate the check digit for document number 'A209841' right now using pen and paper.",
             "Judge Focus: Testing raw mathematical competence on the spot without relying on code."),
            ("Q3.3", "If a document passes all 4 ICAO check digits with 100% accuracy, does that prove the passport is genuine?",
             "Judge Focus: Critical thinking: Checksum only proves internal mathematical consistency. A counterfeiter can easily generate valid checksums for a completely synthetic identity."),
            ("Q3.4", "How does your MRZ parser handle TD1 (ID cards) vs TD2 (Visas) vs TD3 (Passports)? Where is that auto-detection implemented?",
             "Judge Focus: Code verification in `backend/parsers/mrz_parser.py`: line count (2 vs 3) and character length (44, 36, 30)."),
        ]),
        ("ROUND 4: MULTI-SPECTRAL DIGITAL FORENSICS (ELA, NOISE, SOBEL)", [
            ("Q4.1", "Explain the exact physics and mathematical basis of Error Level Analysis. Why does resaving at 90% quality reveal tampering?",
             "Judge Focus: Understanding JPEG discrete cosine transform (DCT) quantization tables and compression error delta accumulation."),
            ("Q4.2", "What is the primary vulnerability of ELA? If a forger saves their modified passport and then flattens and re-compresses the entire image once, what does ELA output?",
             "Judge Focus: Identifying false negatives: uniform re-compression resets the error surface, rendering ELA blind."),
            ("Q4.3", "Why did you combine ELA with Laplacian Noise Variance and Sobel Edge Gradients?",
             "Judge Focus: Defense-in-depth: Laplacian catches blur/smoothing tools, while Sobel catches photo border boundary jumps."),
            ("Q4.4", "Show me the exact mathematical formula you use in `backend/forensics/ela.py` to calculate the tamper score from the difference image.",
             "Judge Focus: Code accuracy: `np.mean(diff_np)`, `np.percentile(diff_np, 95)`, and scaling thresholds."),
        ]),
        ("ROUND 5: BIOMETRICS & FACIAL VERIFICATION", [
            ("Q5.1", "In your documentation, you claim '128-dimensional facial vectors'. Open `backend/biometrics/face_verifier.py`. Are you using FaceNet, ArcFace, dlib, or classical histograms?",
             "Judge Focus: Catching over-claiming: The code actually uses 8x8 block histograms (1024) + Sobel gradient magnitude (256)."),
            ("Q5.2", "Why did you choose Cosine Similarity instead of Euclidean (L2) distance for comparing facial vectors?",
             "Judge Focus: Directional orientation in high-dimensional normalized space vs magnitude sensitivity under uneven illumination."),
            ("Q5.3", "You set your match threshold at 0.75. How was this number determined? Did you generate an ROC curve on LFW or FERET benchmarks?",
             "Judge Focus: Empirical validation vs arbitrary guessing of security-critical thresholds."),
            ("Q5.4", "How does your Presentation Attack Detection (PAD) differentiate between a live human face and a high-resolution iPad screen displaying a photo?",
             "Judge Focus: Understanding 2D Fast Fourier Transform (FFT) frequency spectrum rings for screen moiré patterns in `check_liveness_and_anti_spoofing()`."),
        ]),
        ("ROUND 6: WATCHLIST & INTERPOL INTEGRATION", [
            ("Q6.1", "Your video states you query Interpol Red Notices. Are you actually connected to Interpol's 24/7 I-Link or SLTD database?",
             "Judge Focus: Absolute honesty: Admitting it is an in-memory simulated database (`KNOWN_WATCHLIST` in `watchlist_db.py`) designed to mimic law enforcement protocols."),
            ("Q6.2", "How do you handle name transliteration and typos (e.g., 'Mohammed' vs 'Mohamed') in your watchlist screening?",
             "Judge Focus: Fuzzy string matching algorithms (Levenshtein distance, Jaro-Winkler, Soundex/Metaphone) vs exact string matching."),
            ("Q6.3", "What privacy and security safeguards prevent a corrupt border operator from dumping your entire watchlist database?",
             "Judge Focus: Data encryption at rest, role-based access control (RBAC), and blind index hashing."),
        ]),
        ("ROUND 7: COMPOSITE RISK ENGINE & DECISION TIERS", [
            ("Q7.1", "Your weights are MRZ=30%, Forensics=25%, Biometrics=25%, Watchlist=20%. Why is Watchlist only 20% if a criminal hit is a critical event?",
             "Judge Focus: Understanding hard overrides vs linear weights: Explain the 'Risk Floor' mechanism where a watchlist hit automatically forces risk >= 92% regardless of weights."),
            ("Q7.2", "Your project claims 'Bayesian Risk Scoring'. Where are the Bayesian prior probabilities, evidence updates, and conditional likelihood matrices in `risk_engine.py`?",
             "Judge Focus: Exposing terminology inflation: Defend whether the system uses true Bayesian inference or heuristic multi-factor weighted aggregation."),
            ("Q7.3", "What exact criteria separate 'Secondary Inspection' (Counter 4B) from 'Immediate Detention'?",
             "Judge Focus: Operational protocol justification: Document anomalies vs verified identity fraud / criminal alerts."),
        ]),
        ("ROUND 8: SECURITY, ADVERSARIAL ATTACKS & API DEFENSE", [
            ("Q8.1", "If I submit a 50MB maliciously crafted TIFF file to `/api/screen-document`, what stops your FastAPI worker from crashing with an Out-of-Memory (OOM) error?",
             "Judge Focus: Request payload validation, Content-Length limits, and Pillow `Image.MAX_IMAGE_PIXELS` decompress bomb protection."),
            ("Q8.2", "Can a user bypass the React frontend and directly send forged MRZ JSON to `/api/passengers/new` without a valid document image?",
             "Judge Focus: API authentication, CSRF tokens, Pydantic schema validation, and server-side mandatory image verification."),
            ("Q8.3", "Are uploaded passenger passport images stored on the server? If so, where and how are they encrypted?",
             "Judge Focus: Zero-knowledge architecture, ephemeral memory buffers, and disk cleanup routines."),
        ]),
        ("ROUND 9: PRIVACY, ETHICS & HUMAN-IN-THE-LOOP", [
            ("Q9.1", "Does your biometric matching process comply with India's Digital Personal Data Protection (DPDP) Act 2023?",
             "Judge Focus: Explicit consent, purpose limitation, non-persistence of raw biometric crops, and cryptographically hashed audit trails."),
            ("Q9.2", "What is your system's False Rejection Rate (FRR) across different racial demographics and skin tones under varying checkpoint lighting?",
             "Judge Focus: Algorithmic bias, illumination sensitivity, and skin-chrominance YCrCb fallback limitations."),
            ("Q9.3", "Should an AI system ever have the authority to autonomously detain a human being at a national border?",
             "Judge Focus: Human-in-the-loop governance: The AI only flags and recommends; detention requires human officer legal authority."),
        ]),
        ("ROUND 10: SCALABILITY & AIRPORT PRODUCTION WORKLOAD", [
            ("Q10.1", "Indira Gandhi International Airport (DEL) handles 200,000 passengers daily. How does this architecture scale to handle 10,000 concurrent travelers during peak morning hours?",
             "Judge Focus: Replacing Vercel serverless with Kubernetes-managed FastAPI pods, Celery/Redis task queues, and GPU-accelerated CV nodes."),
            ("Q10.2", "What is the primary computational bottleneck in your backend pipeline: the FFT liveness check, the ELA re-save, or the OpenCV face cascade?",
             "Judge Focus: Profiling knowledge: The JPEG 90% re-save and write-back cycle in memory is the highest CPU consumer."),
        ]),
        ("ROUND 11: PERFORMANCE & BENCHMARK VALIDATION", [
            ("Q11.1", "You claim '< 1.2 seconds' turnaround. Was this measured on local localhost or across the public internet on Vercel?",
             "Judge Focus: Benchmark transparency: Differentiating between algorithmic execution time (< 380ms) and network upload time."),
            ("Q11.2", "How many physical document specimens were tested to establish your accuracy and latency claims?",
             "Judge Focus: Empirical dataset size, benchmark methodology, and synthetic vs real-world document sample distributions."),
        ]),
        ("ROUND 12: CORE INNOVATION & COMPETITIVE DIFFERENTIATION", [
            ("Q12.1", "OpenCV, Sobel filters, and ICAO checksums are publicly available algorithms. What is the novel IP created by 'The Deciders'?",
             "Judge Focus: Explaining the composite correlation engine: cross-validating VIZ against MRZ with multi-spectral forensic fusion in a single-pass pipeline."),
            ("Q12.2", "Why wouldn't the Bureau of Immigration just buy an off-the-shelf German or French e-Gate system?",
             "Judge Focus: Cost barrier ($150,000/gate vs edge-software), indigenization (Make in India), 22 Scheduled Indian Languages, and unified cyber-defense integration."),
        ]),
        ("ROUND 13: VIDEO SCRIPT & DEMO DEFENSE", [
            ("Q13.1", "At 1:10–1:35 in your demo video, you click 'Screen Document' on an altered passport. Was that document processed dynamically in real-time or loaded from a pre-computed sample?",
             "Judge Focus: Demonstrating live dynamic calculation vs static preset playback."),
            ("Q13.2", "In the video, the ELA heatmap shows an orange glow around the photo. Exactly which mathematical parameter in `ela.py` caused that color threshold?",
             "Judge Focus: Connecting UI visual feedback directly to underlying OpenCV color map logic (`cv2.COLORMAP_INFERNO`)."),
        ]),
        ("ROUND 14: CODE DEEP DIVE (FILE-BY-FILE EXAMINATION)", [
            ("Q14.1", "In `backend/main.py`, show me how exceptions raised by `mrz_parser.py` are caught so the whole server doesn't crash on a corrupted image.",
             "Judge Focus: Defensive programming: try/except blocks, HTTP 422 vs HTTP 500 error responses."),
            ("Q14.2", "Explain line-by-line how `backend/forensics/photo_tampering.py` estimates the boundary box coordinates of the photo without training a YOLO model.",
             "Judge Focus: Heuristic geometry vs bounding-box regression."),
        ]),
        ("ROUND 15: TEAM MEMBER DEFENSE & DIVISION OF WORK", [
            ("Q15.1", "Which specific files and modules did YOU personally write, and which technical challenges did you solve?",
             "Judge Focus: Verifying genuine teamwork and weeding out non-contributing team members."),
            ("Q15.2", "If we delete `src/BorderSuite.jsx`, what happens to the Rakshak Cyber Suite in `src/cyber/`? Are they tightly coupled?",
             "Judge Focus: Architecture modularity and component isolation."),
        ]),
        ("ROUND 16: RAKSHAK CYBER-DEFENSE SUITE INTEGRATION", [
            ("Q16.1", "Why does a border identity document screening system have an SMS scam and UPI QR code detector inside it?",
             "Judge Focus: Strategic defense: Explaining holistic border security — stopping physical counterfeiters at the gate while stopping digital cyber-syndicates targeting citizens."),
            ("Q16.2", "How does your Bloom Filter in `src/cyber/engine/bloomFilter.js` prevent false positives when screening malicious phishing domains?",
             "Judge Focus: Bloom filter mathematical principles: optimal bit array sizing, hash function counts, and acceptable false positive trade-offs."),
        ]),
        ("ROUND 17: BREAK-THE-SYSTEM ADVERSARIAL STRESS TEST", [
            ("Q17.1", "Scenario: A traveler presents a completely authentic, valid French passport, but they are the identical twin of the passport holder. Does AegisBorder AI grant entry?",
             "Judge Focus: Admitting biometrics limits: 2D facial geometry cannot differentiate identical twins; requires 3D iris scanning or fingerprint e-Passport chip PKI verification."),
            ("Q17.2", "Scenario: A passenger has heavy flash glare covering two characters in the MRZ zone. What does your OCR and checksum engine do?",
             "Judge Focus: Error propagation handling: Fallback to Visual Inspection Zone (VIZ) with an automated flag for manual officer review."),
            ("Q17.3", "Scenario: The passport was physically laundered/water-damaged, distorting paper noise variance. Will your system falsely classify this legitimate traveler as a criminal?",
             "Judge Focus: False positive management: The risk engine flags for secondary human inspection rather than immediate hostile detention."),
        ]),
    ]

    for round_name, q_list in rounds:
        story.append(Paragraph(round_name, round_title_style))
        for q_id, q_text, judge_focus in q_list:
            story.append(Paragraph(f"<b>{q_id}:</b> {q_text}", q_style))
            story.append(Paragraph(f"<i>&bull; {judge_focus}</i>", attack_style))
        story.append(Spacer(1, 4))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated SIH Judge Question Bank PDF: {filename}")

if __name__ == "__main__":
    default_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "SIH_2026_AegisBorder_AI_Judge_Questions_Bank.pdf")
    out_file = sys.argv[1] if len(sys.argv) > 1 else default_path
    build_pdf(out_file)
