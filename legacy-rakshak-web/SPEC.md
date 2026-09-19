# Rakshak AI — Product Specification (v2)

A realistic, consumer-ready cybersecurity companion for Indian families. Designed to feel like a mature product you could ship to a parent this week, not a futuristic AI demo.

---

## 1. PRODUCT PROMISE

> "Tell me if this is safe, and what to do next."

Every screen must answer, in under three seconds:

1. Am I protected?
2. Is this message / link / payment safe?
3. What should I do next?

---

## 2. CORE PILLARS

- **Trust** — restrained, calm, never sensational. India-grade seriousness.
- **Clarity** — plain Hindi / English, no jargon, no scare copy.
- **Privacy by design** — on-device first, no message history retained.
- **Speed** — scans complete in 1–1.5 s with clear loading states.
- **Accessibility** — large touch targets, voice readouts, high contrast.

---

## 3. SURFACE TAXONOMY

Six first-class surfaces, in this order on the sidebar:

| # | Surface         | Purpose                                                       |
|---|-----------------|---------------------------------------------------------------|
| 1 | Home / Protect  | Status: "Am I protected?"                                     |
| 2 | Message Scan    | Paste SMS / WhatsApp message                                  |
| 3 | Link Check      | Paste URL                                                      |
| 4 | QR / UPI Check  | Paste UPI payload or scan QR                                  |
| 5 | Scam Registry   | Verified 1930 list (PoA blockchain view)                       |
| 6 | More            | Language, theme, helpline, report, settings                    |

Mobile collapses to bottom tab bar: **Home · Scan · Check · Registry · More**.

---

## 4. PRIVACY PANEL (under "More")

✓ Processing happens on-device where supported
✓ Messages are not stored unnecessarily
✓ No personal message history is sold
✓ Protection works without exposing private conversations

Keep this section understated — small text, no illustrations, no marketing voice.

---

## 5. FOOTER

```
Rakshak AI
Digital Safety Companion

Links: Privacy · Safety Guide · Cyber Crime Reporting · Help
```

---

## 6. DESIGN TOKENS

### Typography
- **Family:** Inter (UI) with Geist as a fallback option.
- **Scale:** 12 / 14 / 16 / 18 / 22 / 28 — multiples of 2, 8px rhythm.
- **Weights:** 400 (body), 500 (labels), 600 (buttons / nav), 700 (titles).

### Spacing
- Strict 8px scale: 4 / 8 / 12 / 16 / 24 / 32 / 48.
- Generous breathing room inside cards, never "huge empty" zones.

### Borders
- 1px, `--border-subtle` everywhere. No double borders. No thick dividers.

### Corners
- 8px for inputs, buttons, nav items.
- 10–12px for cards, modal panels.
- Never capsule-pill every component.

### Icons
- Lucide only, single weight, 16 / 20 / 24 sizes.
- No mixed icon families. No AI-generated icons.

### Buttons
- **Primary:** solid blue, 8px radius, 10×18 padding, 14px label.
- **Secondary:** neutral surface, 1px border, blue text on hover.
- **Danger / Success:** same shape, semantic color.
- Hover = subtle brightness + 1px lift, 100–150 ms.

### Color
| Token            | Light   | Dark    | Use                          |
|------------------|---------|---------|------------------------------|
| `--bg-app`       | #F7F8FA | #0B1020 | App canvas                   |
| `--bg-surface`   | #FFFFFF | #121826 | Cards, sidebar, header       |
| `--bg-elevated`  | #F1F3F8 | #1A2030 | Hover, modals                |
| `--border-subtle`| #E5E7EB | #1F2937 | Dividers                     |
| `--text-primary` | #0F172A | #F5F7FA | Headlines, primary text      |
| `--text-secondary`| #475569| #A6AEBC | Body                         |
| `--text-muted`   | #94A3B8 | #6B7280 | Helper, timestamps           |
| `--primary`      | #2D6BFF | #4F86FF | Primary actions              |
| `--success`      | #16A34A | #22C55E | Safe                         |
| `--warning`      | #F59E0B | #FBBF24 | Suspicious                   |
| `--danger`       | #DC2626 | #F87171 | Scam / dangerous             |

No purple-to-orange gradient hero. The hero is calm, single-color, with a single shield glyph.

---

## 7. RESPONSIVE

| Breakpoint | Layout                                                          |
|------------|-----------------------------------------------------------------|
| ≥ 1024 px  | Persistent sidebar (240 px) + main column                       |
| 768–1024   | Collapsible sidebar, icon-only at < 80 px                       |
| < 768      | Bottom nav: Home / Scan / Check / Registry / More               |

The **Message scanner is the highest-priority mobile surface** — paste area fills width, "Scan" button reaches thumb zone, history collapses behind a toggle.

---

## 8. ANIMATION & MICRO-INTERACTIONS

- Page transitions: 150–200 ms fade / slide. No parallax.
- Sidebar: 150 ms width tween.
- Buttons: 100–150 ms scale + brightness.
- Cards: subtle border + shadow on hover, no lift > 2 px.
- Protection status: 2 s slow pulse on green dot.
- Scan animation: 1.0–1.5 s total.

### Scan sequence
1. Button label → "Analyzing…" with a 16 px spinner.
2. Linear step list, one row per 250 ms:
   - Checking message
   - Checking suspicious patterns
   - Checking links
   - Calculating risk
3. Result panel fades in (150 ms). Risk score animates 0 → final via `requestAnimationFrame`.
4. Safe → green check (scale 0.8 → 1, 180 ms).
5. Suspicious → amber / red warning glyph with a 0.4 s subtle attention bounce.
6. Never shake the entire viewport. Never flash red.

### Scam example side panel
- Slides in from right, 200 ms ease-out.
- Shows: original message, risk, reasons, detected techniques, recommended action.

### QR / UPI scan
- Single horizontal scanning line (1 px blue, 1.2 s loop).
- Then verdict chip: Safe / Suspicious / Dangerous.

### Website check
- 4 steps, each ~250 ms: domain, reputation, suspicious patterns, known-scam registry.
- Result card.

---

## 9. SCAM EXAMPLE INTERACTION

Clicking a scam example opens a right-side panel (200 ms slide-in) with:

- **Original message** (verbatim)
- **Risk assessment** (score + verdict)
- **Reasons** (bullet list)
- **Detected scam techniques** (chips: Urgency, Authority Impersonation, Suspicious Link …)
- **Recommended action** (single sentence: "Block sender. Do not call. Report to 1930.")

---

## 10. UX PRINCIPLES (NON-NEGOTIABLE)

- Always answer: protected? safe? what next?
- No decorative UI that doesn't earn its space.
- Every CTAs reads as a verb ("Block sender", "Report", "Copy", "Open registry").
- Default to Hinglish when device locale is `hi-*`, English otherwise.
- Voice readout available everywhere a verdict is shown.

---

## 11. FINAL SHIPPED SHAPE

The result must feel like a real Indian consumer product — closer to **Truecaller / Paytm Security / HDFC SmartHub** than to a SaaS dashboard. Trust, clarity, accessibility, fast interactions, realistic content, simple navigation, human UX, mobile usability.
