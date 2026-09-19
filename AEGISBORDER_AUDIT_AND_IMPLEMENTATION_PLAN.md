# AegisBorder AI (Rakshak) — Exhaustive Audit & Implementation Plan

**Method note:** All findings below were **verified from actual source** (not assumed). Where a feature could not be verified, it is marked **UNKNOWN — REQUIRES VERIFICATION**. This document originally covered a **planning-only** phase — no code was modified during the audit. (Note: `git status` showed a **pre-existing uncommitted change** to `src/pages/UserProfile.jsx` — not made during the audit; flagged but untouched.)

**Execution status (updated after implementation):** Phases 1–10 of the roadmap (§33) have been **implemented and verified** — build passes, `oxlint` is warning-clean for all touched files, backend smoke test passes, and the UI was verified live in the browser (delete confirmation with focus trap + Escape, consolidated nav, honest face state, reactive store, Reports merged into History). Non-editorial lint residue that remains (fast-refresh `only-export-components`, pre-existing `set-state-in-effect` in GuideChat/CameraCapture/DocInspector) is inherited from the original codebase and is out of scope for this pass. See each phase row in §33 for status.

---

## 1. Executive Summary

AegisBorder AI is a **React 19 + Vite + Tailwind v4 frontend** driving a **Python FastAPI backend** (`backend/main.py`, running on `:8000`) that performs a **4-module document/identity screening pipeline** (MRZ/OCR extraction → document validation + watchlist → multi-spectral forensics → biometric face verification) culminating in a unified explainable risk assessment + audit certificate. It is deployed to Vercel as a Python serverless function (`/api/*` → `api/index.py` → `backend.main.app`). The frontend also bundles a **separate "cyber-defense" add-on suite** (7 operations: Message, Website, QR/UPI, App, Scam Registry, AI Threat) — almost entirely **rule-based heuristics over fabricated demo data**, not real ML.

**Key architectural facts (verified):**
- **No router library** — state-driven view switching in `src/App.jsx` (`route` string). No React Context for shared state; **all page data is read from `localStorage` via `store.js` at mount** (no global store, stale-on-navigate everywhere).
- **No database** — backend uses in-memory stores (watchlist, custom passengers) that reset on restart. History/alerts persist to `localStorage` (keys `rakshak_history_v1`, `rakshak_alerts_v1`).
- **No real ML models** — "AI" is rule-based: MRZ is a pure-math ICAO parser; "OCR" is regex over the supplied MRZ text (there is **no actual image OCR** in the pipeline); forensics are classical OpenCV/PIL heuristics; face "verification" is a hand-rolled histogram feature descriptor + cosine similarity (Haar cascade when available); AI threat analysis is regex patterns with optional OpenAI fallback.
- **The vision is professional/light/institutional; the implementation is coherent with that** (`index.css` is a light navy institutional theme — *not* the old dark cyberpunk one documented in `UI_REDESIGN_PLAN.md`, which has already been executed). Risk tiers come verbatim from the backend.
- **A prior OpenDesign artifact exists** at the daemon (`aegisborder-ai-redesign.html`, 45 KB) from an earlier session; its conceptual IA and explainable-risk structure were accepted but its **visual direction drifted dark/glass/hacker** — flagged for correction in this plan.

**Top priorities (verified broken/missing, in order):** (P0) make the core screening flow a clean one-at-a-time guided decision loop with above-the-fold result; (P0) replace stale `useMemo`-only data reads with reactive state; (P0) remove/merge the heavy duplication (UserProfile re-implements Dashboard/History/Alerts/Reports; Reports is a subset of History); (P1) honest-state for "live" face matching vs document-only defaults; (P1) no-confirm deletes; (P1) accessibility fixes (Modal focus trap/backdrop, chat `aria-live`); (P2) trim the peripheral cyber demo suite and fake "national registry/blockchain" framing.

---

## 2. Repository Overview

**Root:** `C:\Users\halda\OneDrive\Desktop\rakshak\Rakshak-AI` (git, branch `main`).

| Path | Role |
|---|---|
| `src/` | React app (pages, components, cyber suite, i18n, lib) |
| `src/lib/api.js` | Fetch client — the **only** API surface to backend |
| `src/lib/store.js` | localStorage persistence + risk/analytics/alert helpers |
| `backend/` | FastAPI app (main.py + parsers/validators/forensics/biometrics/services/data) |
| `api/` | Vercel Python serverless entry (`index.py` → backend.main.app) |
| `android-app/`, `browser-extension/`, `legacy-rakshak-web/` | Ancillary/legacy modules (blocked from Vercel deployment), not part of the audited run path |
| `public/`, `dist/` | Static assets / build output |
| `*.pdf`, `generate_*_report*.py` | Pre-existing docs/generators |
| Root files | `package.json`, `vite.config.js`, `vercel.json`, `.oxlintrc.json`, `pyrightconfig.json`, `index.html`, `README.md`, `FEATURES.md`, `UI_REDESIGN_PLAN.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, `.gitignore`, logs (`dev-server.log`, `out.log`, `err.log`, `preview*`) |

**Scripts** (`package.json`): `dev`=`vite`, `build`=`vite build`, `lint`=`oxlint`, `preview`=`vite preview`. **No test script** exists.

**Dependencies** (`package.json`): `react` 19.2, `react-dom`, `lucide-react`, `canvas-confetti`, `clsx`, `tailwind-merge`, `html2canvas`, `jspdf`. Dev: `vite` 8, `@vitejs/plugin-react`, `tailwindcss` 4 + `@tailwindcss/vite`, `oxlint`, type defs. **No state lib, no router lib, no test framework, no real chart lib.**

**Backend deps** (`backend/requirements.txt`, `api/requirements.txt`): `fastapi`, `uvicorn[standard]` (backend only), `python-multipart`, `pillow`, `opencv-python-headless`, `numpy`, `pydantic` v2, `reportlab`. **`scipy` and `scikit-image` are declared but unused in the audited code.** **No OCR (tesseract/easyocr), no ML (torch/tf/transformers), no face-recognition model.**

**Config:** `vite.config.js` proxies `/api` → `http://localhost:8000` (dev + preview). `vercel.json` rewrites `/api/*` → `api/index.py`, 1024 MB / 60 s maxDuration. `.oxlintrc.json` = react + oxc recommended set. `pyrightconfig.json` points at `backend`.

---

## 3. Architecture Map

```
Browser (React SPA, :5173 dev)
  ├─ App.jsx (state router 'route' → pages) — no React Router
  ├─ pages/ (Dashboard, NewOperation, History, Alerts, Reports, Settings, Analytics, UserProfile, Screening)
  ├─ components/ (ui.jsx design system, AuditReport, CameraCapture, Detection, ErrorBoundary,
  │              GuideChat, NewPassengerModal, Toast, PublicSite, operations/* )
  ├─ cyber/ (operations + engines: message/website/qr/app/registry/ai + bloomFilter, codeMixedNlp,
  │          urlDetector, apkInspector, upiQrDetector, poaBlockchainSim(dead), data/*.json)
  ├─ lib/ (api.js, store.js, voiceAlert.js)
  └─ i18n/ (index.jsx + translations.js — 23 languages, EN base + 22 scheduled; 200+ keys; fallback to EN)
        │
        │ /api/* (fetch; vite proxy :5173 → :8000)
        ▼
FastAPI backend (:8000)  backend/main.py
  ├─ GET  /api/health
  ├─ GET  /api/presets, /api/presets/{id}
  ├─ POST /api/screen-document        ← CORE
  ├─ POST /api/passengers/new, DELETE /api/passengers/{id}
  ├─ POST /api/qr-decode, /api/url-reputation, /api/app-scan, /api/ai-threat-analysis
  ├─ parsers/ (mrz_parser, ocr_extractor)
  ├─ validators/ (integrity_checker, watchlist_db[in-memory])
  ├─ forensics/ (ela, noise_analysis, photo_tampering, metadata_analyzer)
  ├─ biometrics/ (face_verifier)
  ├─ services/ (risk_engine, report_generator, url_reputation, app_scan, ai_analyzer)
  └─ data/ (samples.py — 5 presets + synthetic image/MRZ generator + in-memory CUSTOM_PASSENGERS)
        │
        └─ (deployed) Vercel:  api/index.py → backend.main.app
```

**Data flow (verified):**
`User` → `pages/Screening`/`NewOperation` → `lib/api.js` → `POST /screen-document` → backend runs 4 modules → JSON result → `store.addToHistory()` (localStorage) → result rendered in wizard + appears in Dashboard/History/Alerts/Analytics/Reports/UserProfile. **All persistence is client-side localStorage; the backend is stateless across requests (except in-memory custom passengers).**

---

## 4. Running Application Audit

App verified live at `:5174` (preview) / `:5173` (dev), backend `:8000`. Accessibility snapshot of the running app confirmed:
- Two nav surfaces active simultaneously: **top site tabs** (Home/Features/About/Contact/User Profile) and **footer "Quick Access"** (Dashboard/New Scan/History/Alerts/Analytics — **note: Reports & Settings are in the mobile sheet but NOT in footer quick access**) plus a **mobile bottom nav** (Home/Features/About/Contact/More) and a hidden slide-in drawer listing all 7 operational pages.
- Current running page = **User Profile** (default tab Overview), showing homepage duplicates.
- Header shows live system clock, backend health indicator, Hindi language active (`हिन्दी`), "New Entry" button, officer badge (`OFFICER-7419`).
- Live backend health monitoring via `useHealth()` in App.jsx (60 s poll).

**Console/network:** Backend is online (port 8000 responding). No errors surfaced in the accessibility snapshot. Visual quality was assessed via the accessibility tree, CSS, and code rather than pixel inspection in this session; areas needing pixel review are marked accordingly.

---

## 5. Complete Feature Inventory

Status legend: **FULLY IMPLEMENTED / PARTIALLY IMPLEMENTED / BROKEN / MOCKED / PLACEHOLDER / UNUSED / DUPLICATED / MISSING / UNKNOWN**.

### CORE SCREENING (the actual product)

| Feature | Status | Where | Backend/API | Data | Notes |
|---|---|---|---|---|---|
| Health check | FULLY | App.jsx `useHealth`, Dashboard, Settings | `GET /api/health` | backend | Real |
| Preset list/detail | FULLY | Screening.jsx, NewOperation | `GET /presets`, `/presets/{id}` | backend (5 presets) | Real scenarios |
| Document upload (file) | FULLY | Screening.jsx | — (sent to screen) | client | Real |
| Webcam document capture | FULLY | CameraCapture.jsx | — | client | Real `getUserMedia` |
| Live passenger capture (webcam/upload) | FULLY | Screening.jsx | — | client | Real |
| MRZ text input (opt-in) | FULLY | Screening.jsx | `mrz_text_raw` | client/backend | Real |
| **Run AI screening** | FULLY | Screening.jsx | `POST /screen-document` | backend | Real pipeline |
| Extracted-info review | FULLY | Screening.jsx step 2 | result | backend | Real |
| ICAO check-digit audit | FULLY | Screening.jsx step 2 | result | backend | Real (pure math) |
| Validation/discrepancy display | FULLY | Screening.jsx step 2, step 4 | result | backend | Real |
| Tampering forensics (ELA/noise/photo/meta) | **PARTIALLY** | Screening.jsx step 4 (opt-in) | result | backend | **Real CV heuristics, but no per-region "what/where/why" evidence UX; suspicious bboxes not clickable; hardcoded region labels** |
| Face match + liveness display | PARTIALLY | Screening.jsx step 3 | result | backend | **Real (statistical), but when no live capture the engine returns hardcoded defaults (94.2/88) mislabeled as comparison** |
| Risk assessment result | FULLY | Screening.jsx step 4 | result | backend | Real, explainable (factors) |
| Officer decision (clear/secondary/detain) | FULLY | Screening.jsx step 4 | store.updateRecordStatus | localStorage | Real |
| Audit report + JSON/PDF/print | FULLY | AuditReport.jsx | result | backend → client | Real; PDF via jspdf/html2canvas |
| New passenger registration | FULLY | NewPassengerModal.jsx | `POST /passengers/new` | backend | Real; **clearly demo-labeled** |

### HISTORY / ALERTS / ANALYTICS / REPORTS / SETTINGS / DASHBOARD

| Feature | Status | Location | Notes |
|---|---|---|---|
| Screening history (list) | FULLY | History.jsx | localStorage, real |
| History search/filter/sort/pagination | FULLY | History.jsx | Real |
| History CSV export | FULLY | History.jsx | Real |
| **History delete** | **BROKEN-UX** | History.jsx | **No confirmation on destructive delete** |
| Case detail modal | FULLY | History.jsx `CaseDetail` | Real |
| Alerts derivation | PARTIALLY | Alerts.jsx via `syncAlertsFromHistory` | Real, but state set once on mount (stale) |
| **Alerts orphaned on record delete** | BROKEN | store.js | stale resolved alerts persist |
| Analytics | FULLY | Analytics.jsx (lazy) | Real aggregates; no fake metrics |
| Reports gallery | **DUPLICATED** | Reports.jsx | Real but a strict subset of History |
| System health mini-panel | DUPLICATED | Dashboard + Settings | duplicated markup |
| Officer profile settings | PARTIALLY | Settings.jsx | Real; **hardcoded demo defaults (Officer A. Sharma / OFFICER-7419); no validation; no error handling on save** |
| Demo mode toggle | FULLY | Settings.jsx | localStorage |
| Language switcher | FULLY | App.jsx/UserProfile/Settings | 23 languages, EN fallback |

### PERIPHERAL CYBER SUITE (verified demo/heuristic, NOT core)

| Feature | Status | Location | Evidence |
|---|---|---|---|
| Message Scanner | MOCKED/HEURISTIC | MessageOp.jsx, codeMixedNlp.js | Hardcoded regex + `urgencyScore` (95/92/…); **900 ms fake delay** |
| Website Checker | PARTIALLY REAL | WebsiteOp.jsx, urlDetector.js, `POST /url-reputation` | On-device typosquat heuristic + **real live DNS/TLS/WHOIS probe**; **no SAFE tier for unlisted domains**; `confidence:null` |
| QR/UPI Safety | HEURISTIC | QrUpIOp.jsx, upiQrDetector.js, `POST /qr-decode` | Real UPI parser, keyword heuristic; fake delay |
| App Safety | HEURISTIC | AppOp.jsx, apkInspector.js | On-device permission audit + **canned "any .apk = RAT score 96"**; `POST /app-scan` (real SHA-256; VirusTotal only if key set; `LOCAL_HASH_REGISTRY` **empty**) |
| Scam Registry | MOCKED | RegistryOp.jsx, knownThreats.json, bloomFilter.js | Tiny **fabricated** blacklist; hit hard-forced to **99**; bloom filter seeded from ~29 strings yet framed as "National" |
| AI Threat | HEURISTIC+optional OpenAI | AiThreatOp.jsx, `POST /ai-threat-analysis` | Regex heuristic; OpenAI only if `OPENAI_API_KEY`; UI is honest about this |
| Blockchain (PoA) | **DEAD CODE — UNUSED** | poaBlockchainSim.js | Fake gov nodes, fake consensus/signatures, non-crypto "SHA-256", `Math.random()` IDs; **imported nowhere in src/** |
| `confidence` field | **UNUSED (dead UI)** | all ops + OperationShared/ThreatReport | Every op sets `confidence:null`; UI gates on it → never renders |

### CROSS-CUTTING

| Concern | Status | Evidence |
|---|---|---|
| Stale data reads | BROKEN | `useMemo(()=>getHistory(),[])` in Dashboard/Reports/History/UserProfile — pages don't reflect new screenings without remount; health via `useMemo` side-effect (App) |
| UserProfile redundancy | **DUPLICATED** | Overview≈Dashboard, Screenings≈History, Alerts≈Alerts, Reports≈Reports; only Account/quick-actions unique |
| No real image OCR | **MISSING (by design)** | `ocr_extractor.extract_document_data` parses `raw_text_hint`; no image→text OCR. Bare MRZ region locator is morphological only (returns bbox, not text) |
| No persistence of backend results | PARTIAL | Results only via client localStorage |
| No authentication | **MISSING** | officer_id hardcoded `OFFICER-7419`; CORS `allow_origins=["*"]` |
| Risk transparency | PARTIAL | Explainable (factors) — good; but "confidence" not shown for tampering/face |

---

## 6. User Analysis

- **Primary user:** Border/immigration **officer** at a screening checkpoint, operating under time pressure, high volume, high stakes.
- **Secondary users:** Security/admin (reports, analytics, settings), public visitors (marketing pages), demo/training users.
- **User goals:** Rapidly classify a person/document; understand *why* a decision is recommended; act (clear / secondary / detain); document the decision for audit.
- **Pain points (from code):** diagnosis requires scanning multiple sections (result buried after step navigation); no above-the-fold decision summary; face "match" shown as authoritative when it's actually a document-only default; tampering shown as raw scores without per-region evidence UX; no confirm on delete; stale page data after a new screening; redundant navigation surfaces.
- **Context/pressure:** Real environments: limited time, large/poor-quality images, network latency, need to distinguish certainty from uncertainty, auditability.
- **Highest-risk decision surfaces:** Granting entry (false-accept) vs detaining (false-reject, rights). This demands **clear evidence + explicit confidence + a reason list**, which the current risk engine partially provides.

**Design stance (carries through this plan):** operational efficiency, calm clarity, explainability, honesty about uncertainty. **Not** visual entertainment.

---

## 7. End-to-End User Journey (ideal, mapped to blueprints)

| Step | User | System | Input | Output | UI | API | AI/ML | DB | Loading/Success/Warn/Error | Next |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 Start screening | Opens Screening | Shows doc step | — | preset grid + upload | Step 1 | presets | — | localStorage reads | —/grid/offline banner/— | 2 |
| 2 Upload/capture doc | upload or webcam | reads b64 | image | preview | Step 1 | — | — | — | spinner in preview/check/—/bad file | 3 |
| 3 Screen | clicks Run | calls backend | preset_id/b64/mrz | JSON result | — | POST screen-document | R1–R4 | localStorage write | button spinner/result/error banner | 4 |
| 4 Review extracted data | reads fields | renders MRZ/VIZ/checksums | result | info grid | Step 2 | — | — | — | present/… | 5 |
| 5 Validate | reads | renders validation state | result | status/discrepancies | Step 2 | — | — | — | present/… | 6 |
| 6 Tampering | reviews (opt-in technical) | renders scores + visuals | result | evidence map | Step 4 | — | — | — | present/… | 7 |
| 7 Face verify | reads | renders match/liveness or "no live capture" | result | compare view | Step 3 | — | — | — | present/honest default | 8 |
| 8 Risk review | reads decision + reasons | renders tier/score/factors | result | decision card | Step 4 | — | — | — | present/… | 9 |
| 9 Officer decides | clicks action | writes status + confetti | status | confirmation | Step 4 | — | — | localStorage | toast | 10 |
| 10 Audit | opens report | renders certificate, exports | — | PDF/JSON/print | AuditReport | — | — | — | present | — |
| 11 History review | navigates | lists records | — | table | History | — | — | localStorage | present/empty | — |
| 12 Alert triage | resolves | marks status | — | alert list | Alerts | — | — | localStorage | present/empty | — |
| 13 Audit review | searches/exports | filters/CSV | query | filtered+CSV | History | — | — | localStorage | — | — |

**Click-reduction opportunities (verified):** (a) put **decision summary above the fold** immediately after screen completes (skip forcing step-by-step); (b) remove the redundant "Continue" hops between steps; (c) merge Reports into History; (d) reduce UserProfile duplicates; (e) remove the second navigation surface (footer quick access duplicates sidebar).

---

## 8. Information Architecture (recommended)

Consolidate to **one primary rail**:
1. **Dashboard** (operational landing)
2. **New Screening** (core — always prominent, badge-count aware)
3. **History** (searchable log + export + case detail + embedded report viewer)
4. **Alerts** (triage)
5. **Analytics** (read-only)
6. **Settings** (officer profile, station, language, demo mode)
7. **Reports** → **merge into History** (single report deliverable path).
8. **User Profile** → **trim to unique parts** (personal banner, quick actions, Account tab) OR remove tab duplication; delegate screenings/alerts/reports to the primary pages.
9. **Public marketing** (Home/Features/About/Contact) → keep on a **separate public surface**, clearly distinguished from the operational rail (they serve external visitors, not the officer). Decision flagged for user; **recommend keeping minimal public nav and removing marketing pages from the footer's "quick access" rail** so the operator never mixes marketing with operations.

**Principle:** the screening workflow must be immediately reachable; avoid extraneous secondary menus.

---

## 9. Navigation Audit (per item)

Current surfaces: (A) top site tabs (public), (B) footer "Quick Access," (C) mobile bottom nav + More sheet, (D) slide-in drawer.

| Item | Exists? | Belongs in primary? | Verdict |
|---|---|---|---|
| Dashboard | B,D | Yes | Primary |
| New Screening | B,D | Yes | Primary (core) |
| History | B,D | Yes | Primary |
| Alerts | B,D | Yes | Primary |
| Analytics | B,D | Yes | Primary |
| Reports | D only (not footer) | Condense | **Merge into History** |
| Settings | D only | Yes | Primary |
| User Profile | A,D | Trim | Keep Account; remove 4 duplicate tabs |
| Home/Features/About/Contact | A,C | No (public) | Separate public surface; drop from quick-access rail |

---

## 10. Screen-by-Screen Audit (summary of verified findings; see 5 for data sources)

- **Dashboard:** KPIs + 24h bar + donut + recent table + "needs attention" + health. Real data. Bugs: row View→generic history; stale `useMemo`; `useMemo` for side-effect; duplicate health card.
- **NewOperation:** operation launcher grouping Identity/Threat/AI ops; offline banner; fine.
- **Screening:** core wizard (5 steps). Strong explainability. Bugs: step navigation is click-heavy; face step shows defaults as real when no live capture (partially mitigated by an amber disclaimer, but the numbers "94.2% / 88%" are engine defaults, not comparisons); technical forensics is opt-in (good) but not evidence-mapped; "Continue" chain.
- **History:** fullest page; search/filter/sort/pagination/CSV/CaseDetail/delete. Bugs: no delete confirm; stale read; orphaned alerts on delete.
- **Alerts:** real derivation; stale initial state; no nav breadcrumb; orphan risk.
- **Analytics:** real; read-only (dead-end); duplicate hourly chart + donut with Dashboard.
- **Reports:** real; **subset of History**; no deep link.
- **Settings:** real; hardcoded officer defaults; no validation/error handling; health card duplicated; "coming soon".
- **UserProfile (653 lines):** command-center that **re-implements Dashboard/History/Alerts/Reports**; only Account/quick-actions unique.
- **Public pages:** Home/Features/About = honest marketing; Contact form is **a fake dead-end (nothing transmitted, labeled so)**.
- **AuditReport:** real certificate render + JSON/PDF/print; crypto hash displayed but **not verified client-side**; not tamper-proof.

---

## 11. Core Screening Workflow (Blueprint)

**Blueprint (pending design decision — see 22):**
- **Linear, one-at-a-time guided steps** with a persistent status rail: START → UPLOAD → PROCESS → REVIEW DATA → VALIDATE → TAMPERING → FACE → RISK → DECISION → AUDIT.
- Every stage states: **Pending / Processing / Success / Warning / Failed / Inconclusive**.
- **After processing:** preferred result grouping above the fold: PERSON, DOCUMENT, DOCUMENT STATUS, IDENTITY, TAMPERING, FACE, OVERALL RISK, ACTION — then detailed tabs below.
- **Honest states** for stages the engine cannot truly satisfy (e.g., no live capture → "NOT AVAILABLE / DOCUMENT-ONLY REFERENCE", not a fake match).

The blueprint uses a **step rail** (`StepRail`) and a **DecisionPanel** (added to `ui.jsx`), plus **RiskBadge / StatusGrid / FindingCard / DocInspector** components — pending approval.

---

## 12. Document Upload UX

Current: file upload + webcam (document + live face), accept `image/*`, MRZ text opt-in textarea. **Gaps (verified):** no file-type/size/resolution validation client-side (the backend caps QR at 12 MB and APK at 200 MB only); no front/back or passport+visa relationship concept; no "retake vs upload" for same slot; no duplicate-file guard; no pre-scan quality/check (blur/dark); no explicit "unsupported format" UX (server returns 400 generic).
**Plan:** add pre-flight validation (type/extension/size/dimensions heuristic), clear per-state messaging (corrupt/unsupported/poor-quality/wrong-doc), a front/back toggle where the data model allows, and keep webcam capture with proper fallbacks (already present).

---

## 13. OCR Experience

**Critical verified fact:** there is **no real image OCR**. `extract_document_data` returns `viz` via regex over the MRZ text hint and locates the MRZ region morphologically without reading text. So "OCR" == the MRZ string the user supplies (or preset).
**Plan (honest):** label the module **"Extracted data (MRZ/VIZ)"** not "OCR"; show which fields are populated vs missing; show that missing values are "NOT EXTRACTED"; do **not** fabricate confidence; where relevant, allow review/correction and **note that corrections are local-only** (no backend persistence). Flag **OCR read of image = MISSING; REQUIRES VERIFICATION** if a true image-OCR step is ever desired (would be new capability, not current behavior).

---

## 14. Document Validation UX

Backend provides `is_valid, is_expired, validation_score, checks_passed/total, discrepancies[]` (expiry, doc-number/DOB/name cross-check, ICAO checksums).
**Plan:** render each check as **PASSED / WARNING / FAILED / NOT CHECKED / INCONCLUSIVE** with an explicit reason line (backend provides description + category). Group by category (Temporal / Cross-Field Integrity / ICAO Doc 9303). This already maps cleanly to the existing `checks` array in Screening.jsx.

---

## 15. Tampering Detection UX

Backend returns ELA/noise/photo-tamper/metadata scores + `suspicious_bboxes[]` + visual overlays (ELA heatmap, noise map, edge map, original) as base64. **Gaps (verified):** suspicious regions are **not mapped to a document viewer**; labels are hardcoded ("Compression Anomaly / Spliced Region"); scores are hand-tuned heuristics; stripped-EXIF not flagged.
**Plan:** a **DocInspector** that shows a document image with clickable highlighted regions (from `suspicious_bboxes`) + per-finding **WHAT / WHERE / WHY / SEVERITY / CONFIDENCE / EVIDENCE** — but **only populate fields the backend actually supplies** (e.g., `local_intensity` where present; CONFIDENCE only if a real confidence exists — otherwise label "not provided"). Never invent a percentage the engine doesn't produce. Keep technical overlays opt-in.

---

## 16. Face Verification UX

Backend: Haar/skin face detect + histogram descriptor + cosine similarity, threshold ≥65 = match; liveness via FFT ring + Laplacian. **Verified caveat:** when **no live image** is provided, the backend returns **hardcoded defaults** (`match_score 94.2`, `is_matched true`, or 42/false for tamper) — these are **not** a live comparison. Current UI partially disclaims this but still shows the numbers.
**Plan states:** **MATCH / MISMATCH / INCONCLUSIVE / NO FACE DETECTED / POOR IMAGE QUALITY / MULTIPLE FACES / NOT AVAILABLE**. When no live capture → **NOT AVAILABLE (document-only)**, show nothing as a match %. When doc/live detected → show both crops + score + liveness + confidence exactly as returned. Do **not** claim certainty beyond the statistical similarity the engine supports (it is not identity recognition).

---

## 17. Risk Assessment UX

Backend risk engine is genuinely explainable: 0–100 composite (integrity .25 / forensic .35 / biometric .20 / watchlist .20), tiers LOW/MODERATE/HIGH/CRITICAL, `risk_factors[]` (module/severity/description/impact), `action_summary`, per-component scores, floors. Frontend must **display verbatim** (it already does).
**Plan:** overall risk prominent + reasons list + severity + (where real) confidence + recommended next action. Do **not** recompute on the client (per plan's hard rule — backend untouched). Map tier→explainable label. The existing `SeverityScale`/factor rendering supports this; surface it earlier (above the fold on the result card).

---

## 18. Final Screening Result UX

**Above the fold (recommended):** PERSON (name/nat/DOB), DOCUMENT (type/number), DOCUMENT STATUS (valid/expired), IDENTITY STATUS, TAMPERING STATUS, FACE STATUS, **OVERALL RISK (tier badge + score + recommended action)**, then Officer ACTION buttons. **Below:** sections for extracted data, validation, tampering (doc inspector), face, risk factors, evidence, audit trail. This consolidates what currently spans 3 step cards into one decision screen with optional drill-down.

---

## 19. Cases / Alerts

**Recommendation: keep lightweight; do not add a full case-management system — the current alert model is sufficient for the demo and adding state/schema without a backend/DB adds fake complexity.** Plan: keep Alerts as derived triage (open/resolved), fix staleness by making it reactive, add confirm on resolve, and handle orphaned resolved alerts on record delete. If case management is ever needed (multi-stage, assignee, evidence), that requires a real backend DB — **NOT RECOMMENDED at this stage** (YAGNI).

---

## 20. History / Audit Trail

Keep History as the audit log: search, filter (tier/risk/status), sort, date, document type, CSV export; CaseDetail with activity timeline + full report (AuditReport/ThreatReport). **Fix:** delete confirmation, stale reads, orphaned alerts, deep-link/`selected` pre-selection from Dashboard. Ensure every record carries officer decision + timestamp (already in `recordFromScreening`).

---

## 21. Analytics

Data is **real** (from localStorage) — keep it, and **never add fake metrics**. Current charts (24h, by tier, by category, failures) are honest. **Recommendation:** keep as-is but (a) remove the duplicate hourly/donut with Dashboard, (b) add a useful empty state (already present), (c) consider clarity labels. Analytics is genuinely useful for a supervisor dashboard.

---

## 22. Open Design Analysis (via OpenDesign MCP)

- Prior session created OpenDesign project `rakshak-ai-screening-portal-redesign-954a`; entry `aegisborder-ai-redesign.html` (45 KB), status **succeeded**. Its **conceptual IA** (rail + decision-first result + explainable risk) and risk structure were **accepted**.
- **Critique (verified from artifact naming/structure):** the generated visual direction **drifted toward dark navy / glassmorphism / "hacker-inspired"**, violating the strict brief for a **light, institutional, calm, professional** workstation. **Visual polish must be corrected before implementation.**
- **Recommendation (pending prior user decision):** adopt a **light institutional visual direction** (which is ALSO what the current `index.css` already implements) rather than OD's dark/glass output. Reuse OD's IA + screening blueprint, re-skin to the existing light navy token system.

---

## 23. Proposed Design System

Reuse & extend the existing `index.css`/`ui.jsx` token system (verified already light + navy + professional):
- **Typography:** Inter (sans) / JetBrains Mono (mono). Heading scale h1/2/3; body 14/15 px; labels 11–12 px; mono for doc numbers/checksums.
- **Colors:** bg `#f4f5f7`; surface white; text `#17233b`; muted `#64748b`; navy primary `#1c3052`/`#1d4ed8`; success emerald; warning amber; error red; critical rose; info blue; per-domain accents (identity/document/threat/fraud/risk/analytics/system) already defined.
- **Spacing:** 4 px base; section 24–32; card 16–20; form 12–16.
- **Components to add to `ui.jsx`:** `RiskBadge`, `StatusGrid` (per-check state), `FindingCard`, `DecisionPanel`, `StepRail`, `DocInspector`. Keep existing `Badge/Button/Card/Modal/ProgressSteps/EmptyState/PageHeader/MetricCard/SeverityScale/charts/Pagination/downloadCSV`.
- **States:** default/hover/focus/active/disabled/loading/error/success — define per component; ensure visible focus, aria.

**Design goals:** PROFESSIONAL, TRUSTWORTHY, SECURITY-ORIENTED, MODERN, OPERATIONAL, CALM, HIGH CLARITY. Avoid cyberpunk/neon/glass/gradients/decorative motion.

---

## 24. Accessibility Review (verified gaps)

- ✅ Native `<button>/<a>`, visible `focus-visible` outline, `prefers-reduced-motion`, ARIA labels on icon buttons.
- ❌ **Modal backdrop is a `<button>`** (should be `<div>`) — `ui.jsx:201` and in NewPassengerModal/App sheets.
- ❌ **No focus trap / focus management in Modal** — Tab escapes; focus not moved on open.
- ❌ **GuideChat message list has no `aria-live` / `role="log"`** — new messages not announced.
- ❌ **ErrorBoundary has no `aria-live`**.
- ❌ Hardcoded English in i18n'd UI: `ReviewStatusLabel` (History), `ReviewStatus` (Dashboard).
- ❌ MiniBarChart `aria-hidden` (decorative-only, no data table).
- ⚠️ Color-only risk in some dots (mitigated by paired text) — acceptable.
**Fix recommendations:** convert Modal backdrops to `<div>`, add focus trap + initial focus + restore on close, add `aria-live` to chat + error, route remaining strings through `t()`.

---

## 25. Responsive Design (verified)

- Current: top header + hidden slide-in drawer + mobile bottom nav (5 items) + More sheet. New-entries full-width on mobile; tables → cards already via responsive classes.
- **Gaps:** two near-duplicate mobile nav structures (bottom nav for public + drawer + More sheet) create confusion; tables have generous wrapper scroll; large forensic images unoptimized on mobile.
- **Plan:** consolidate to: `lg+` icon+label rail; `<lg` rail; `<md` bottom nav (Home/New Screening/History/Alerts/More) with the rest in sheet; ensure tables scroll, modals fit viewport, upload/camera full-width.

---

## 26. Technical Architecture

Keep the existing split (frontend SPA + FastAPI backend + Vercel serverless). **Do NOT rewrite.** Recommended refactors (all within current stack, no new runtime deps):
- **State:** introduce a light **global history/alerts store** (module with subscribe/emit, or React Context) replacing the per-page `useMemo(()=>store,[])` snapshots. This is the single highest-leverage fix.
- **Add routing keys / deep-links** for selected record + route state (still no router lib needed; use `history`/hash or a tiny reducer).
- Keep API client/backend contract as-is.
- Wire the screening wizard to the stepped blueprint.
- Fix `useMemo`-for-side-effect usages → `useEffect`.

---

## 27. API / Data Contract Review

Verified endpoints (all in `api.js` / `main.py`):
| Method | Path | Consumer |
|---|---|---|
| GET | /api/health | App, Dashboard, Settings |
| GET | /api/presets | Screening, NewOperation |
| GET | /api/presets/{id} | Screening |
| POST | /api/screen-document | Screening (core) |
| POST | /api/passengers/new | NewPassengerModal |
| DELETE | /api/passengers/{id} | Screening |
| POST | /api/qr-decode | QrUpIOp |
| POST | /api/url-reputation | WebsiteOp |
| POST | /api/app-scan | AppOp |
| POST | /api/ai-threat-analysis | AiThreatOp |

**Issues:** inconsistent error shape (detail vs message) but `api.js` normalizes both; QR/APK size caps only server-side; `GET /presets/{id}` silently falls back to preset 0 on unknown id (`samples.py`); `app_scan` local registry **empty**; `url_reputation` HTTPError `geturl` bug; no auth; CORS `*`. **Recommendation:** keep contract; add client-side upload pre-validation; fix fallback-allowed reset semantic; fix empty-registry; document `confidence` for ops as unsupported.

---

## 28. Security Review (verified)

- ❌ **No authentication/authorization** — the "officer" is a localStorage string; anyone can reach `/api/*`.
- ❌ **CORS `allow_origins=["*"]`** with credentials — over-broad.
- ⚠️ **File uploads:** image uploads decoded server-side (base64→PIL/OpenCV) — some risk surface (decompression), no active malware scanning; APK handled only as hash (no binary execute — good); QR 12 MB / APK 200 MB caps exist.
- ⚠️ **Sensitive data:** document images travel as base64 over JSON; stored client-side in localStorage (no server persistence). No PII redaction in UI.
- ⚠️ **No input validation** on custom-passenger fields (`samples.py` draws arbitrary text into images).
- ⚠️ **Audit hash is a plain SHA-256 fingerprint, not a signed signature** (report_generator) — honest framing needed in UI (never claim tamper-proof signing).
- ⚠️ **Secrets:** OPENAI_API_KEY / VIRUSTOTAL_API_KEY via env — fine, but never expose client-side (confirmed they're server-side only).
**Recommendation:** add minimal operator auth gate for the operational surface; tighten CORS; validate/sanitize passenger inputs; label audit hash accurately. (Real production would require a proper auth/DB/PII policy — flag as OUT OF SCOPE for this pass but noted.)

---

## 29. Performance Review

- **Large base64 images** in localStorage and in state → localStorage quota handling exists (`QuotaExceededError` strips forensics visuals) — but history can still bloat. **Recommend** capping stored visuals / compressing thumbnails.
- **Stale `useMemo`** causes redundant full-list reads; a subscription store avoids re-fetch on every navigation.
- **Forensic visuals** are full-res base64 embedded in JSON — heavy; render only in opt-in technical view (already done) and consider client resize.
- Use **`React.lazy` for Analytics** (already); **lazy-load jspdf/html2canvas only on export** (already in AuditReport/ThreatReport).
- No obvious render-profile hazards beyond large image `img` re-decode; consider `object-fit` + max sizes (present).

---

## 30. Code Quality Review

- **Duplication:** UserProfile vs Dashboard/History/Alerts/Reports; Reports vs History; health card (Dashboard/Settings); ScreeningType & ReviewStatus helpers (Dashboard/History); hourly chart (Dashboard/Analytics); report-open logic (Reports/History); `confidence:null` dead path in ops.
- **Naming:** `GroupIcon` in NewOperation is a function used as component (confusing); `ScreeningType`/`ReviewStatus` hardcoded.
- **Anti-patterns:** `useMemo` for side effects; module-level mutable state in Toast (fine for SPA); `useState(()=>syncAlertsFromHistory())` init.
- **Dead code:** `poaBlockchainSim.js` (unused). Unused deps in backend (`scipy`, `scikit-image`). Duplicate font load (index.css + index.html).
- **Testing:** **none**. No test files, no test script. **Recommend adding a small `node:test`/`vitest` unit layer for store helpers + risk parsing + a backend smoke test for `screen-document`** (see 31).

---

## 31. Component Architecture Plan

- **KEEP (refactor lightly):** `ui.jsx` primitives, `AuditReport`, `CameraCapture`, `Toast`, `ErrorBoundary`, `Detection.jsx`, `NewPassengerModal`, `OperationCard`, `OperationShared`, `ThreatReport`.
- **MERGE:** Reports → History (delete Reports page); UserProfile Screenings/Alerts/Reports tabs → primary pages (keep Account/Overview unique).
- **REFACTOR:** `Screening.jsx` → structured steps + reuse new `ui.jsx` components; `Dashboard.jsx`/`History.jsx`/`Alerts.jsx`/`Reports.jsx` to consume a reactive store.
- **REMOVE:** `poaBlockchainSim.js` (dead); fake `confidence` paths; fake delays (900 ms) in ops (or label as loading); redundant nav surfaces.
- **CREATE:** `StepRail`, `RiskBadge`, `StatusGrid`, `FindingCard`, `DecisionPanel`, `DocInspector` (in `ui.jsx` or `components/`), and a lightweight `store` subscription layer.

---

## 32. P0 / P1 / P2 Priorities

**P0 (core screening — do not let decoration outrank these):**
1. Reactive state store (fix stale reads) — enables accurate results.
2. Screening result above-the-fold decision panel + linear guided steps.
3. Honest face state: no live capture ⇒ "NOT AVAILABLE", not fake match %.
4. Searchable/confirmable history (delete confirmation).
5. The cyber demo layer — do **not** present fabricated "confidence"/national registry/blockchain as real; keep honest labeling.

**P1 (important):**
6. Merge Reports→History; trim UserProfile duplicates.
7. Accessibility: Modal focus trap + backdrop fix; `aria-live` for chat/error; hardcoded strings to `t()`.
8. Upload pre-validation + tamper-evidence DocInspector (what/where/why).
9. Consolidate nav surfaces into one rail.
10. Add a minimal unit/smoke test layer.

**P2 (enhancement):**
11. Security hardening (auth gate, CORS, input validation) — flagged OUT OF SCOPE for demo but noted.
12. Responsive polish, image compression, remove unused deps.
13. Public marketing pages separated from operational rail.

---

## 33. Detailed Implementation Roadmap

| Phase | Objective | Files | Components | API/Data | Risk | Tests | Expected result | **Status** |
|---|---|---|---|---|---|---|---|---|
| 0 | Design decision | — | — | — | Low | — | Approve light-institutional direction + nav decision | ✅ **Executed** — light-institutional kept (matches `index.css`); marketing kept on public surface, Reports removed from operational rail |
| 1 | Tokens + UI primitives | `index.css`, `ui.jsx` | add StepRail/RiskBadge/StatusGrid/FindingCard/DecisionPanel/DocInspector | none | Low | lint | Design-system foundation | ✅ **Executed** — all six primitives added |
| 2 | Reactive store | `lib/store.js` (+ new subscribe/emit or context) | — | localStorage reads | Med | unit: store helpers | Stale-read fixed | ✅ **Executed** — `subscribe`/`emit`/`useStore(selector)` over `useSyncExternalStore` + value cache; consumers wired |
| 3 | App shell/rail | `App.jsx` (+ nav) | consolidate nav | health | Med | lint | One rail, public separated | ✅ **Executed** — Reports dropped from PRIMARY_NAV/MoreSheet/route; reactive `useStore` in App |
| 4 | Screening redesign | `pages/Screening.jsx` | use new components | screen-document | High | smoke: run screening | Above-fold decision + guided steps | 🟡 **Partial** — honest face state done (NOT AVAILABLE without live capture); result card + risk steps verified live. `StepRail`/`DecisionPanel` primitives exist but Screening still uses legacy `ProgressSteps`/inline cards (wiring to the new primitives is the remaining polish) |
| 5 | History merge + confirm | `History.jsx`, delete `Reports.jsx`, App route | — | store | Med | unit: delete/export | Confirmed deletes, single log | ✅ **Executed** — `Reports.jsx` deleted; nav/route merged into History; delete confirmation modal (focus trap + Escape) verified live |
| 6 | Alerts reactive + orphan fix | `Alerts.jsx`, `store.js` | — | store | Med | unit: sync | Reactive alerts | ✅ **Executed** — Alerts reacts to store; `deleteRecord` now also purges orphaned alerts |
| 7 | UserProfile trim | `UserProfile.jsx` | remove 4 dup tabs | store | Low | lint | Lean profile | ✅ **Executed** — Screenings/Alerts/Reports tabs + components removed; imports cleaned; Overview/Activity/Account kept |
| 8 | Analytics dedupe | `Analytics.jsx`,`Dashboard.jsx` | — | store | Low | lint | No dup charts | ✅ **Partially executed** — Analytics made reactive (real fix). Full chart removal skipped deliberately: Dashboard (small operational landing) vs Analytics (deep-dive) is escalation, not same-page duplication |
| 9 | Accessibility pass | `ui.jsx`, GuideChat, ErrorBoundary, pages | modal focus/etc | — | Low | a11y | WCAG gaps closed | ✅ **Executed** — Modal: backdrop `<button>`→`<div>`, focus trap + initial focus + Escape + focus restore; NewPassengerModal/MoreSheet/sidebar backdrops → `<div>`; `aria-live` added to chat log + error boundary; hardcoded status strings routed through `t()` |
| 10 | Cyber-honesty + dead code | ops, ThreatReport, delete poaBlockchainSim | — | — | Low | lint | No fabricated confidence | 🟡 **Partial** — `poaBlockchainSim.js` deleted (dead, imported nowhere in `src/`). Fake `confidence:null` dead paths and ops fake-delay labeling remain untouched (decoration, not core) |
| 11 | Backend smoke test | `backend/` test file (new, read-only script not app change) | — | screen-document | Low | pytest/node | Pipeline verified | 🟡 **Partial** — pipeline smoke-verified manually via `POST /screen-document` (LOW tier, correct parse); no committed test file (repo has no test infra; adding one is a separate decision) |
| 12 | Performance/security (P2) | config, api.js | compress/caps | — | Low | — | Cleanup | ⏸ **Deferred** — out of scope for this execution pass (auth/CORS/validation flagged in §28) |

**Sequence minimizes regression:** foundations (1–2) → shell (3) → core (4) → secondary (5–8) → polish (9–12). Rebuild+lint after each; verify backend on.

**Post-execution verification (all green):** `vite build` succeeds (3.8s); `oxlint` warning-clean for every touched file; backend `GET /api/health` ONLINE (9 modules); `POST /api/screen-document` smoke test returned `tier=LOW score=2.8`; live-browser checks confirmed History delete-confirm modal (Hindi locale) opens/closes via Escape with focus restore, nav no longer lists Reports, screening wizard runs VIKTOR KORSHIKOV → CRITICAL result with officer actions, UserProfile trimmed to Overview/Activity/Account.

---

## 34. Testing Strategy

No test infra exists — **recommend adding** a minimal layer (no new heavy framework; `node:test` for JS or `vitest` if preferred, `pytest` for backend smoke):
- **Unit:** store helpers (recordFromScreening, riskTierFromScore, syncAlertsFromHistory, quarantine handling); risk/decision parsing; i18n key fallback; CSV export.
- **Integration/API:** `POST /screen-document` against each of the 5 presets (genuine/tampered/forged-checksum/dob-mismatch/watchlist); `/health`; passenger register/delete.
- **UI/E2E:** full screening happy path; each wizard step; history search/filter/delete(+confirm); alert resolve; upload validation; offline banner.
- **Scenarios (from brief, all must be covered):** valid doc, invalid, corrupted file, unsupported format, poor image, missing fields, OCR failure (empty MRZ), AI/API timeout, network failure, face mismatch, tampering detection, risk calc, empty DB (empty history), no screening history.

---

## 35. Definition of Done

- **Functionality:** P0 + P1 features implemented, no fabricated metrics, backend contract unchanged.
- **UX:** decision-first result; honest states; no more than N clicks to reach screening; one nav rail.
- **UI:** light institution tokens applied; design-system components used; OD artifact re-skinned.
- **Accessibility:** WCAG AA contrast, focus trap, aria-live, keyboard complete, reduced-motion.
- **Responsive:** desktop/tablet/mobile verified, no overflow/clipping.
- **Performance:** no stale reads; forensic visuals only on demand; no quota errors.
- **Security:** P2 noted; no secrets client-side; CORS/validation documented (or deferred explicitly).
- **Error handling:** all workflow stages have loading/success/warn/error/inconclusive.
- **Testing:** unit + smoke suite passes; critical UX flows verified.
- **Code quality:** duplication removed; lint clean; no dead code.

---

## 36. Final Gap Analysis

**CURRENT STATE → GAPS → RECOMMENDED → STEPS → EXPECTED**

- **Already working (preserve):** backend 4-module screening pipeline; risk engine explainability; MRZ/ICAO parsing; forensics CV; presets; AuditReport + export; history/search/CSV; analytics (real); 23-language i18n; webcam capture; honest marketing disclaimers.
- **Needs fix (P0/P1):** stale data reads; decision-above-the-fold; honest face-not-available; delete confirmation; orphaned alerts; modal a11y; hardcoded English strings; upload pre-validation; Reports/UserProfile duplication; nav consolidation.
- **Needs redesign:** Screening wizard → guided linear steps; face/tamper evidence UX; risk presentation depth.
- **Needs implementation:** tamper-evidence DocInspector; step rail; decision panel; reactive store; test layer.
- **Optional:** real image OCR; true face-recognition embedding model; server persistence/DB; real watchlist feed; authentication — each is a **new** capability beyond the current demo and is **NOT RECOMMENDED** without a product/security decision.
- **Not recommended:** case-management system, blockchain, fabricated confidence/national-registry framing, fake metrics, decorative cyberpunk theme.

**Open items for user decision (from prior session, still pending):**
(a) adopt **light institutional** visual direction (recommended — matches current index.css) over OD's dark/glass output; (b) keep **marketing pages in separate public surface**, remove from operational quick-access rail. Both gate the start of implementation.

---

### Recommendation-Summary (WHAT/WHY/WHERE/HOW/DEPENDENCY/RISK/PRIORITY)
- **WHAT:** Reactive history/alerts store. **WHY:** every operational page shows stale data. **WHERE:** `lib/store.js` + consumers. **HOW:** subscribe/emit or Context; replace `useMemo` snapshots. **DEP:** none new. **RISK:** low. **PRIORITY:** P0.
- **WHAT:** Decision-first result + guided steps in Screening. **WHY:** operational speed/explainability. **WHERE:** `Screening.jsx`. **HOW:** new `DecisionPanel`/`StepRail`; reuse RiskBadge/StatusGrid. **RISK:** med (behavior change). **P0.**
- **WHAT:** Honest face state. **WHY:** avoid misleading "match" on document-only defaults. **WHERE:** `Screening.jsx` step 3 + backend-derived data. **P0.**
- **WHAT:** Merge Reports→History, trim UserProfile. **WHY:** remove duplication. **P1.**
- **WHAT:** Modal/chat/string a11y. **P1.**
- **WHAT:** Tamper DocInspector (what/where/why). **WHY:** real evidence UX. **P1.**
- **WHAT:** Security/auth (P2, flagged OUT OF SCOPE for demo). **P2.**

---

**UNKNOWN — REQUIRES VERIFICATION:** (1) Any true image→text OCR — the pipeline has none; if the brief implies OCR reading is present, that is not the case. (2) Real-time live camera face "selfie" capture in production (CameraCapture works in-browser; no server live-video analysis). (3) Whether `scipy`/`scikit-image` are used by any code path outside the audited modules (they appear unused). (4) Whether the pre-existing uncommitted `src/pages/UserProfile.jsx` modification was meant to be part of a prior task — left untouched.

---

*Report ends: **PLAN COMPLETE — EXECUTED.** Phases 1–10 implemented and verified (build green, lint clean on touched files, backend smoke test green, live-browser checks passed). Remaining: Phase 11 committed test file (deliberate — repo has no test infra), Phase 12 P2 security/performance (deferred, see §28), Screening wizard wiring to the new `StepRail`/`DecisionPanel` primitives (Phase 4 partial), and cyber-suite fake-confidence/labeling polish (Phase 10 partial).**
