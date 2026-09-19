# UI Redesign Plan — Rakshak AI Integrated Screening Station

## 1. Current Architecture

- **Entry / shell**: `src/main.jsx` → `src/App.jsx` (dark, cyberpunk). A single scroll page containing a language "quick-guide" header, `BorderSuite` (the border screening terminal), a "Scam Guard" divider, and `CyberSuite` (the Rakshak cyber-defense app).
- **Screening app**: `src/BorderSuite.jsx` — tabbed terminal (Overview HUD / Forensics Studio / MRZ & Validation / Biometrics). Owns all screening state: `presets`, `activePresetId`, `documentImage`, `liveImage`, `mrzText`, `screeningResult`, `isLoading`, modal flags, toasts, confetti.
- **Components** (`src/components/`): `Header`, `PresetBar`, `DocumentIngestion`, `MRZTerminal`, `ForensicViewer`, `BiometricsPanel`, `RiskDecisionPanel`, `AuditReportModal`, `NewPassengerModal`. All render against a dark glassmorphism design system (`src/index.css`: orbs, glass cards, scanline, glows, grid overlay).
- **Rakshak suite**: `src/cyber/` — self-contained, self-styled app (`.cyber-suite` scope, own sidebar/topbar/bottom-nav, 21 components, engines: bloomFilter, urlDetector, apkInspector, upiQrDetector, poaBlockchainSim, codeMixedNlp, regionalDictionary with 6 languages). Untouched by this redesign.
- **Styling**: Tailwind v4 via `@tailwindcss/vite`; Inter + JetBrains Mono fonts.
- **No router**; state-driven view switching (established pattern, kept).
- **Dept**: `canvas-confetti`, `clsx`, `html2canvas`, `jspdf`, `lucide-react`, `react` 19, `tailwind-merge`. `html2canvas`/`jspdf` are unused → will be used for PDF report export.

## 2. Existing Features (preserved, not replaced)

Backend (`backend/main.py`) is the source of truth. Endpoints:
- `GET /api/health` — engine status + active modules.
- `GET /api/presets`, `GET /api/presets/{id}` — simulation test scenarios + custom passengers.
- `POST /api/screen-document` — full pipeline: OCR/MRZ → document validation → watchlist → forensics (ELA, noise, photo tampering, metadata) → biometrics (face + liveness) → risk engine → audit cert.
- `POST /api/passengers/new` (with `tamper_scenario`) — register IRL passenger + auto-screen.
- `DELETE /api/passengers/{id}`.

Key data shapes surfaced in the UI:
- `extracted_data.mrz` (incl. `checksums` per-field `{extracted,calculated,valid}` + `overall_valid`), `extracted_data.viz`.
- `document_validation` — `is_valid`, `is_expired`, `validation_score`, `discrepancies[]`.
- `watchlist_screening` — `flagged`, `highest_severity`, `alerts[]` (built-in simulated Interpol/blacklist DB).
- `forensics.summary` (ela/noise/photo-tamper/metadata scores, `detected_software`, `suspicious_bboxes`) + `forensics.visuals` (original, ELA heatmap, noise map, edge map — all b64).
- `biometrics` — `match_score`, `is_matched`, `confidence`, `liveness{liveness_score,is_live,moire_artifact_detected,sharpness_index}`.
- `risk_assessment` — `overall_risk_score`, `risk_tier`, `recommended_decision`, `action_summary`, `component_scores{4}`, `risk_factors[]`.
- `audit_report` — `audit_id`, `timestamp`, `officer_id`, `cryptographic_hash`, `checkpoint_id`, `record_payload`.

**Risk tiers come from the backend** (`risk_engine.py`): LOW `<25` → GRANT ENTRY; MODERATE `<55` → SECONDARY INSPECTION; HIGH `<80` → REFUSE ENTRY & ESCORT; CRITICAL → DETAIN & CONFISCATE. The frontend **displays** the backend's tier/score verbatim; it does not recompute thresholds. (The brief's 26–50/51–75 bands describe a single-variable banding; the engine's actual composite thresholds are preserved unchanged since the backend must not be touched.)

## 3. UI Problems in the Current Implementation (from inspection)

1. **Dark cyberpunk aesthetic** — orbs, scanlines, glows, glass panels. Reads as a demo, not a workstation.
2. **Fake data in the UI**: `Header` renders a random "SCANS:" counter; biometrics show fabricated defaults (`match_score 88/94.2` when no live feed) and "LIVE BIO CONFIRMED" badges; PresetBar shows an animated "pulse" on WATCHLIST. Violates the "no pretending" rule. → Removed / re-labelled.
3. **Every AI module is a nav item** (`Forensics Studio`, `MRZ & Validation`, `Biometrics`). Cognitive load.
4. **No application-level navigation** — dashboard, history, alerts, analytics, reports are missing; everything is one long scroll.
5. **Huge circular gauges + glowing "threat profile" banners** — over-dramatized risk presentation.
6. **Risk factors labelled as "Threat Vectors (+N)" military language**; decrypting decisions.
7. **No screening history, no search, no alert triage, no reports page**.
8. **Mobile**: the tabbed/dark layout is not a guided mobile flow; no bottom nav.
9. **Accessibility**: focus rings are custom/soft, icon-only buttons lack `aria-label`, color-only semantics everywhere.
10. **Watchlist/forensics/technical detail is default-visible** — the officer should opt in.

## 4. Proposed Layout

Single-page app shell (state-driven, no router lib):

```
┌───────────────────────────────────────────────────────┐
│ Topbar: Rakshak AI · Integrated Screening Station      │
│         [system status] [clock] [officer badge]        │
├──────────┬────────────────────────────────────────────┤
│ Sidebar  │  Page content (Dashboard / New Screening /  │
│ Dashboard│  History / Alerts / Analytics / Reports /   │
│ New      │  Settings)                                  │
│ Screening│                                              │
│ History  │  ── Integrations ──                          │
│ Alerts   │  Rakshak Threat Defense (add-on suite)     │
│ Analytics│                                              │
│ Reports  │                                              │
│ Settings │                                              │
├──────────┴────────────────────────────────────────────┤
│ Mobile: fixed bottom nav (Dashboard, + New Screening,  │
│ History, Alerts, More→sheet)                           │
└───────────────────────────────────────────────────────┘
```

Design tokens (light, professional):
- bg `#f4f6f9` / cards white, navy text (`#0f1b2d`), blue primary (`#1d4ed8`), green `#15803d`, amber `#b45309`, red `#b91c1c`. Subtle borders `#e2e8f0`, soft shadows, rounded-xl, Lucide icons.

Page map:

| Page | Content |
|---|---|
| Dashboard | Greeting + KPIs (People Screened, Cleared, Needs Review, Active Alerts) · START NEW SCREENING · Needs Your Attention · Recent Screening table · System health mini-panel |
| New Screening | 5-step wizard: 1. Document → 2. Information → 3. Face → 4. Analysis → 5. Result. Demo scenarios = real presets, clearly marked DEMO. |
| Screening History | Searchable, filterable session log of **real API screening results**, persisted in `localStorage`. Mobile = cards. |
| Alerts | Derived **only** from real HIGH/CRITICAL/watchlist-flagged results from this session; what/why/case/recommended action + severity. |
| Analytics | Aggregates of the same session log — simple CSS bar charts, no chart lib, lazy-loaded. |
| Reports | Session screenings rendered as a professional report (Case ID, officer, results, risk, decision, evidence, audit token) with **PDF/download** (jsPDF + html2canvas, existing deps) + print + JSON. |
| Settings | Officer/station profile, language (drives add-on suite), demo mode banner, link to Rakshak Threat Defense add-on, "coming soon" states. |

## 5. Component Changes

- **Delete (replaced)**: `src/BorderSuite.jsx`, `src/components/*` (old dark components), old `src/App.jsx`. `src/index.css` rewritten (light design system; cyber.css untouched, retains its dark-scoped theme).
- **Add**:
  - `src/lib/api.js` — thin fetch client for the 5 endpoints (no fake responses).
  - `src/lib/store.js` — session history (localStorage) + risk/decision helpers + formatters.
  - `src/components/ui.jsx` — primitives: `Card`, `Badge`, `Button`, `StatusPill`, `Modal`, `ProgressSteps`, `EmptyState`, `SectionTitle`.
  - `src/pages/*.jsx` — Dashboard, Screening, History, Alerts, Analytics, Reports, Settings, ThreatDefense.
  - `src/components/ScreeningFlow.jsx` — the 5-step wizard + result stage + AuditReport modal.
  - `src/components/AuditReport.jsx` — light professional report preview + PDF/JSON export (reused by Reports + Result step).
  - `src/components/NewPassengerModal.jsx` — light restyle of the existing registration flow (same payload → same endpoint).
- **New Screening flow** (`ScreeningFlow.jsx`) — step state, "Run Screening" triggers `POST /api/screen-document` with document b64 / preset / mrz / live face; steps 2–5 render the returned result; a **precision note**: every number displayed comes from the API response.
- **Honest-state rules**: "Demanded" — no fabricated scan counters; biometric/liveness with no live capture shows "No capture provided" and only reports what the backend returned; any default backend fallback values are displayed as returned, and demo scenarios are badged **DEMO MODE**.

## 6. Responsive Strategy

- `lg+`: fixed 240px sidebar + workspace.
- `md`: sidebar collapsible (icon rail) / hamburger overlay.
- `<md`: no sidebar; fixed bottom nav (5 items) + full-screen pages; **tables become cards** (history/alerts/reports); New Screening buttons large + bottom-anchored; camera & upload flows full-width.

## 7. Accessibility

- Visible focus rings (`focus-visible`) via Tailwind utilities; `aria-label` on icon-only buttons; semantic `<nav>`, `<main>`, `<section aria-labelledby>`; form labels + `aria-describedby`; WCAG AA contrast (navy-on-light); `prefers-reduced-motion` respected (no decorative animation except a spinner).

## 8. Performance

- No new dependencies. `jsPDF`/`html2canvas` loaded dynamically only when a PDF is requested. Analytics page lazy-loaded via `React.lazy`. Heavy forensic visuals render only inside the Analysis "View technical details" expander.

## 9. Implementation Sequence

1. `index.css` → light design system.
2. `lib/api.js`, `lib/store.js`.
3. `ui.jsx` primitives.
4. `App.jsx` shell + routing + topbar/sidebar/bottom-nav.
5. Dashboard → New Screening wizard → History → Alerts → Analytics → Reports → Settings → Threat Defense add-on.
6. Build, fix all errors, verify each route, check console/API, verify mobile widths.

## 10. Not changing

- `backend/**` entirely (pipeline, endpoints, thresholds, PDF generators in repo root).
- `src/cyber/**` (Rakshak suite) — preserved behind "Threat Defense" integration page.
- Risk thresholds — as returned by the backend, displayed verbatim.