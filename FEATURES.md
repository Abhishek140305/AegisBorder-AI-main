# AegisBorder AI — Complete Feature Catalog (Transferable)

All features of the AegisBorder AI screening platform, cataloged by module
with source-file references so they can be ported to another project.

---

## 1. Backend API (FastAPI — `backend/main.py`)

| Method | Endpoint | Feature |
| :--- | :--- | :--- |
| GET | `/api/health` | Service health + active module manifest |
| GET | `/api/presets` | List all threat presets + custom passengers |
| GET | `/api/presets/{id}` | Full preset payload (image, MRZ, metadata) |
| POST | `/api/screen-document` | Full 4-module screening pipeline → risk assessment + audit cert |
| POST | `/api/passengers/new` | Register passenger, auto-generate ICAO MRZ+document image, run screening |
| DELETE | `/api/passengers/{id}` | Remove custom passenger from session |

Fetures of `screen-document` response:
- `extracted_data` (mrz + viz + raw text)
- `document_validation` (integrity checks, expiry, discrepancies)
- `watchlist_screening` (Interpol/blacklist hits)
- `forensics` (scores + visual overlays: original, ELA heatmap, noise map, edge map)
- `biometrics` (face match score, liveness/PAD)
- `risk_assessment` (0-100 score, tier, decision, component scores, factor list)
- `audit_report` (SHA-256 signed ledger record)

---

## 2. Module 1 — OCR & ICAO 9303 MRZ Engine (`backend/parsers/`)

### `mrz_parser.py`
- **Check-digit calculator**: ICAO 9303 weighted scheme `[7, 3, 1]` — `WEIGHTS = [7,3,1]`, `char_to_value()` maps `0-9`, `A-Z` (A=10), `<`=0.
- **TD3 parser** (`parse_td3_passport`): 2×44-char passports. Extracts issuing country, surname/given names, doc number, nationality, DOB, sex, expiry, optional data. Verifies 4 check digits: document number, date of birth, date of expiry, **composite/master** check.
- **TD2 parser** (`parse_td2_visa`): 2×36-char visas/IDs. Verifies doc number, DOB, expiry check digits.
- **Format auto-detection** (`parse_mrz_text`): sniffs line length (44→TD3, 36→TD2) from raw text.
- **Century inference** (`parse_date`): expiry rolls to 2000s (within +40yr), DOB rolls to 1900s (past years).

### `ocr_extractor.py`
- **MRZ region locator** (`locate_mrz_region`): crops bottom 35% of document using black-hat transform + Sobel gradient + Otsu threshold (morphology-based, no heavy OCR dependency).
- **VIZ text parser** (`extract_viz_fields_from_metadata`): regex-labels Name/Doc No/Nationality/DOB/Expiry/Sex/Gender fields, incl. visa stamps (stay duration, entries).
- **Full extraction pipeline** (`extract_document_data`): coordinates MRZ parse + VIZ parse + bbox + dimensions.

---

## 3. Module 2 — Document Validation & Watchlist (`backend/validators/`)

### `integrity_checker.py`
- Expiry check vs. current date (CRITICAL discrepancy).
- **MRZ vs VIZ cross-verification** of: document number, date of birth, name — flags mismatches.
- Iterates all MRZ check-digits and reports invalid checksums as CRITICAL.
- Produces `validation_score` (0-100), `is_valid`, `checks_passed/total`, categorized discrepancy list (Temporal / Cross-Field Integrity / ICAO Doc 9303 Standard).

### `watchlist_db.py`
- In-memory watchlist with 3 seeded records: INTERPOL RED NOTICE (CRITICAL), BORDER BLACKLIST (HIGH), STOLEN BLANK DOCUMENT (CRITICAL wildcard over doc-number prefix).
- `check_watchlist()` matches on doc number (exact/substring) + name substring, returns `flagged`, `matched_count`, `highest_severity`, full alerts.
- `add_watchlist_entry()` runtime seeding of new records.

---

## 4. Module 3 — Multi-Spectral Forensics (`backend/forensics/`)

### `ela.py` — Error Level Analysis
- **`perform_ela`**: in-memory JPEG re-compress at quality=90, `ImageChops.difference`, brightness-amplified residual map, contour detection of high-error clusters → `suspicious_bboxes` (with `local_intensity`), composite 0-100 tamper score.
- **`generate_heatmap_overlay`**: JET colormap blended 55/45 over original image.
- **`image_to_base64`**: numpy RGB → base64 JPEG data-URL.

### `noise_analysis.py` — Noise Inconsistency
- Laplacian high-pass filtering, 32×32 tiled variance grid, VIRIDIS map, anomaly blocks flagged when variance deviates > 2.2σ from median, 0-100 score.

### `photo_tampering.py` — Portrait Replacement
- Sobel gradient analysis of portrait border ring, HSV color-histogram Bhattacharyya divergence (portrait vs. background), MAGMA edge map with drawn photo box, `avg_border_gradient`, `photo_tamper_score`, `is_photo_tampered`.

### `metadata_analyzer.py` — EXIF Forensics
- Scans `Software`, `Artist`, `ImageDescription` for 14 known editors (Photoshop, GIMP, Canva, Paint.NET, Lightroom, Snapseed, PicsArt, Pixlr, Affinity, Pixelmator, Pillow, ImageMagick, ExifTool…).
- Flags camera-tag absence and capture/modification timestamp mismatches → `metadata_tamper_score`.

---

## 5. Module 4 — Biometric Face Verification (`backend/biometrics/face_verifier.py`)

- **Face detection**: OpenCV Haar cascade (when available) + **YCrCb skin-chrominance + geometry fallback** for the passport portrait zone.
- **Feature vector** (`compute_face_feature_vector`): 128×128 equalized gray → 8×8 cells × 16-bin histograms + Sobel magnitude pyramid, L2-normalized.
- **1:1 match** (`verify_faces`): cosine similarity (dot product) → similarity %, threshold ≥ 65 matched, 1.08 scoring bump.
- **Liveness / Presentation Attack Detection (PAD)** (`check_liveness_and_anti_spoofing`): FFT high-frequency ring analysis for **moiré/screen-replay artifacts**, Laplacian blur detection, `liveness_score`, `sharpness_index`.

---

## 6. Unified Risk Decision Engine (`backend/services/risk_engine.py`)

Weighted 0-100 composite risk index:
```
composite = integrity*0.25 + forensic*0.35 + biometric*0.20 + watchlist*0.20
```
- Watchlist CRITICAL hit → floor 92; document expired → floor 72; photo tamper > 75 → floor 85; CRITICAL/HIGH discrepancies → floor 62/48.
- Sub-threshold noise suppression (ELA ≤30, photo ≤40, noise ≤35 ignored).
- **Decision matrix**: `<25 LOW/GRANT ENTRY`, `<55 MODERATE/SECONDARY INSPECTION`, `<80 HIGH/REFUSE ENTRY & ESCORT`, `≥80 CRITICAL/DETAIN & CONFISCATE`.
- Returns per-component scores + line-item `risk_factors` (module/severity/description/impact).

---

## 7. Audit Trail Certificate (`backend/services/report_generator.py`)

- SHA-256 immutable ledger record: `audit_id` (`BCP-<ts>-<hash8>`), UTC timestamp, officer_id, checkpoint, signature algorithm, hashed payload of doc number/name/score/decision.

---

## 8. Synthetic Document Generator (`backend/data/samples.py`)

- **`generate_icao_mrz`**: builds standards-valid TD3/TD2 MRZ strings with correct check digits; optional `tamper_checksum` (corrupts final digit for forgery tests); surname<<GIVEN<NAMES conventions.
- **`create_synthetic_passport_image`**: 750×480 rendered passport/visa with guilloché grid background, header stripe, portrait box (avatar or real uploaded photo), `tamper_photo` (red-border sticker + noise-box artifact) and `tamper_text` (red "[MODIFIED]" DOB) overlays, stamp/hologram, MRZ band — all ASCII-drawn, no font assets needed.
- **5 built-in threat presets**: genuine German passport · spliced photo · forged visa (bad checksum) · DOB inconsistency · Interpol red notice.
- **Custom passenger registration**: scenario badges (`tamper_photo`, `tamper_checksum`, `tamper_text`, `watchlist`, `expired`, `none`), auto-MRZ, optional live portrait paste, session-scoped `CUSTOM_PASSENGERS` store with add/delete.

---

## 9. Frontend (React 19 + Vite + Tailwind v4)

### Global shell (`src/App.jsx`)
- Animated cinematic background (orbs, grid overlay, scanlines), glassmorphism.
- **Critical alert banner** — flicker-animated red strip when watchlist flagged or tier ≥ CRITICAL.
- Preset loading, manual re-screening, passenger registration & delete flows.
- **Confetti** on GRANT ENTRY decision; toast system (success/error/warning/info).
- Tab navigation: Overview / Forensics / MRZ & Validation / Biometrics.

### Components (`src/components/`)
| Component | Features |
| :--- | :--- |
| `Header.jsx` | Live clock, scan counters, defense status, tab nav, "+ New Entry" trigger |
| `PresetBar.jsx` | Threat-preset chips, active-state highlight, delete for custom passengers |
| `DocumentIngestion.jsx` | **Dual-channel ingestion**: upload document + webcam capture (navigator camera), MRZ text editor textarea, "Run AI Screening" button |
| `MRZTerminal.jsx` | Monospace terminal: extracted MRZ/VIZ fields, check-digit audit table, integrity/validation report, watchlist result |
| `ForensicViewer.jsx` | **ELA heatmap, noise map (VIRIDIS), edge-gradient map (MAGMA)** with overlay toggle + anomaly bbox list + score gauges |
| `BiometricsPanel.jsx` | Document portrait vs live camera split view, similarity %, liveness/PAD gauges, anti-spoof alerts |
| `RiskDecisionPanel.jsx` | Risk gauge (0-100), tier + decision + action summary, component breakdown, factor list, action buttons (GRANT / SECONDARY / DETAIN) |
| `AuditReportModal.jsx` | Formal certificate modal with SHA-256 hash, officer/checkpoint, printable layout |
| `NewPassengerModal.jsx` | **3-step wizard**: Identity (name/DOB/sex/nationality + ICAO country chips) → Document (type/doc no/expiry/upload/notes) → Biometrics (webcam or upload, skippable) → auto-screening on submit |

### Config
- `vite.config.js`: `/api` → `http://localhost:8000` proxy, port 5173, Tailwind v4 plugin.
- Styling: `index.css` glassmorphism utilities, shimmer/scanline/CSS animations.

---

## 10. Tech Stack (port target)

**Backend**: Python 3.10+ · FastAPI · uvicorn · Pydantic v2 · OpenCV (`opencv-python-headless`) · NumPy · SciPy · scikit-image · Pillow · ReportLab.
**Frontend**: React 19 · Vite · Tailwind CSS v4 · lucide-react · canvas-confetti · clsx · tailwind-merge · html2canvas · jsPDF.

**Run commands**:
```
# backend (from backend/)
python -m venv .venv && .venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000

# frontend (from frontend/)
npm install
npm run dev        # http://localhost:5173
```

---

## 11. Notes for Porting

- No external ML models required — faces use Haar cascade + hand-crafted histogram features; MRZ uses a pure-math parser; forensics are CV heuristics. All run CPU-only, sub-second.
- No database — in-memory stores (`WATCHLIST_RECORDS`, `CUSTOM_PASSENGERS`) reset on restart.
- All images travel as base64 JPEG data-URLs over JSON.
- Face matching is statistical-similarity (not identity recognition) — fine for demos, swap in a real embedding model for production.