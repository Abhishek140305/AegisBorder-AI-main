# Rakshak AI Browser Extension (Chrome / Edge / Brave)

Detects **scam / phishing messages** and **fake links** on web apps
(WhatsApp Web, Gmail, Messenger, Telegram Web, Discord, LinkedIn) **in the
background** — both while you use the sites and when you click/open a
suspicious URL — then alerts you with a desktop notification, a toolbar
badge, and an in-page red warning overlay.

It reuses Rakshak AI's on-device engines: code-mixed Indic threat NLP,
banking typosquatting / URL phishing detector, UPI debit-trap inspector, and a
local Bloom filter. **No message content is ever sent to any server** — all
scanning happens locally on your machine.

## What it monitors (in the background)

| Source | What Rakshak detects |
| --- | --- |
| Web messages (WhatsApp Web, Gmail, Messenger, etc.) | Electricity-cut panic, bank/KYC "account blocked", KYC verification, fake lottery/cashback, remote-access app scams, traffic-challan threats |
| Links inside messages & the pages you visit/click | Typosquatted bank domains (`sbi-bank-kyc-update.top`), risky TLDs, `.apk` downloads, homograph/punycode tricks |
| UPI deep links (`upi://pay?...`) | Deceptive "Cashback/Reward/Refund" payment requests that debit your bank |

## Install (unpacked extension)

1. Open your browser's extensions page:
   - **Chrome / Brave / Edge:** go to `chrome://extensions` (or `edge://extensions`)
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select this folder: `Rakshak-AI/browser-extension`
5. Pin the Rakshak AI shield icon to your toolbar.

> All scans run on-device. To also block/warn on your *own* clicked links,
> the extension requests host access to the pages you visit (see popup toggle
> "Scan visited / clicked links").

## How to use

- Open the pinned **Rakshak AI** icon to see recent detections and toggle
  alerts (desktop notifications, badge, in-page overlay, link scanning).
- Threats raise a **red notification**, a toolbar **badge**, a **red
  in-page banner** on the site showing which scam pattern was matched, and a
  **voice alert** ("Possible scam message detected").
- Each distinct threat is alerted once. After you dismiss the banner it stays
  gone until a *new/different* threat is detected (no repeated pop-ups).
- Voice keeps working even when the messages tab is in the background: for a
  critical threat the extension briefly focuses the tab so the browser's
  autoplay policy doesn't mute the announcement. Toggle it in the popup.
- When in doubt, report scams to India's **National Cyber Crime Helpline 1930**.
- Use the **▶ Run demo test** button in the popup to instantly verify the whole
  pipeline works: it runs a real scam text through the engine and triggers the
  red banner, voice alert, notification and badge on your active tab. Use
  **🔊 Test voice** to check the spoken alert on its own.

## How detection works (architecture)

All scanning runs **in the background service worker** (`background.js`) using
standard ES-module imports of the detection engines. The content script only
samples visible page text and asks the worker to analyze it, then draws the
overlay and speaks the alert it is told to. Keeping the engines in the worker
(not dynamically imported into every page) makes detection reliable on sites
with strict Content Security Policies.

## Project structure

```
browser-extension/
├── manifest.json          # MV3 manifest (permissions, entry points)
├── background.js          # Service worker: runs 24/7, runs detection engines, alerts
├── content.js             # Samples visible message text, draws overlay, speaks alerts
├── overlay.css            # In-page warning banner styling
├── popup.html / popup.js  # Dashboard: settings + detections + demo/voice test buttons
├── engine/                # Local detection engines (no network)
│   ├── nlp.js             # Code-mixed Indic scam patterns
│   ├── urlDetector.js     # Typosquatting / phishing URL inspector
│   ├── upi.js             # UPI debit-trap inspector
│   ├── bloom.js           # Local Bloom filter (offline blacklist lookups)
│   └── data.js            # Threat + legitimate-institution datasets
└── icons/                 # Extension icons
```

## Notes / limitations

- Browser extensions can only see what is **inside the browser** — they
  cannot read OS-level SMS/WhatsApp *native* apps. For phone messages use the
  native Android app (`/android-app`).
- Message scanning samples visible text on supported sites. Some sites use
  heavy virtual DOMs; scanning is throttled and caps at ~4000 chars to stay
  lightweight.
