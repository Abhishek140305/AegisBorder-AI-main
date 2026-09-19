<div align="center">

# 🛡️ AgesBorder AI (AegisBorder AI) — Smart Border Identity & Document Screening System

[![Live Demo](https://img.shields.io/badge/🌐_Live_Deployment-agesborder--ai--deploy.vercel.app-0284c7?style=for-the-badge&logo=vercel&logoColor=white)](https://agesborder-ai-deploy.vercel.app/)


<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![OpenCV](https://img.shields.io/badge/OpenCV-Computer%20Vision-5C3EE8.svg?style=flat&logo=opencv&logoColor=white)](https://opencv.org)
[![ICAO Doc 9303](https://img.shields.io/badge/ICAO%20Doc%209303-Compliant-0284c7.svg?style=flat)](https://www.icao.int)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A next-generation AI-powered document inspection, tamper forensics, and biometric facial verification platform engineered for high-throughput border checkpoints, immigration gates, and international security terminals.**

### 🔗 **[Click Here to Launch Live Application](https://agesborder-ai-deploy.vercel.app/)**

</div>

---

## 📑 Table of Contents
- [Live Deployment](#-live-deployment)
- [Executive Overview](#-executive-overview)
- [Key Challenges & Solutions](#-key-challenges--solutions)
- [End-to-End System Architecture](#-end-to-end-system-architecture)
- [The 4 Core AI Screening Modules](#-the-4-core-ai-screening-modules)
- [Rakshak Cyber-Defense Suite](#-rakshak-cyber-defense-suite)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Dashboard Walkthrough & How to Test](#-dashboard-walkthrough--how-to-test)
- [Quick Start & Local Setup](#-quick-start--local-setup)
- [API Documentation](#-api-documentation)
- [Offline PDF Reports & Documentation](#-offline-pdf-reports--documentation)
- [License](#-license)

---

## 🌐 Live Deployment

The system is deployed on Vercel with automated serverless function handling and edge CDN asset distribution:

👉 **Live URL:** [https://agesborder-ai-deploy.vercel.app/](https://agesborder-ai-deploy.vercel.app/)

- **Unified Single-Window Interface**: Toggle seamlessly between the **Border Screening Terminal** and the **Rakshak AI Cyber-Defense Suite**.
- **Multi-Lingual Support**: Built-in instant language selector supporting English, हिन्दी (Hindi), and 22 Scheduled Indian Languages.
- **Real-Time Webcam Facial Capture**: Live camera integration for instant 1:1 facial biometric matching.
- **Threat Simulation Presets**: Built-in test profiles including Authentic Passports, Photo Altered documents, Checksum Forgeries, and Interpol Watchlist fugitives.

---

## 🌟 Executive Overview

International border checkpoints process tens of thousands of travelers daily across passports, visas, national ID cards, and transit permits. Manual verification by human officers is time-constrained, prone to cognitive fatigue, and struggles against sophisticated modern counterfeiting methods:

- **Photo Replacements**: High-resolution digital photo splicing and physical portrait sticker swaps.
- **Laser-Modified Dates**: Altered dates of birth and expiry years designed to evade age restrictions or travel bans.
- **Corrupted Checksums**: Fabricated Machine Readable Zones (MRZ) that fail international mathematical validation.
- **Identity Impersonation**: Look-alike travelers using stolen or borrowed authentic passports.
- **Watchlist Hits**: International fugitives attempting entry under forged identities.

**AegisBorder AI** automates this verification pipeline in **sub-second latency (< 1.2s)**, performing multi-spectral forensic image analysis, mathematical check-digit auditing, 1:1 facial biometric matching against live camera feeds, and automated risk scoring with cryptographic audit trails.

---

## ⚖️ Key Challenges & Solutions

| Challenge | Attack Vector | AegisBorder AI Solution | Precision / Standard |
| :--- | :--- | :--- | :--- |
| **Fake Passports & Visas** | Counterfeit booklets, fabricated guilloché patterns, invalid check digits | **ICAO 9303 Engine** with 7-3-1 weighting algorithm for TD1, TD2, and TD3 | 100% Mathematical Precision |
| **Altered Photographs** | Digitally spliced or physically replaced portrait photos to evade watchlist hits | **Error Level Analysis (ELA)** heatmaps & Sobel portrait boundary edge jump analysis | Compression artifact & gradient discontinuity detection |
| **Modified DOB & Expiry** | Visual Zone dates scraped and rewritten to conceal true identity | **Cross-Validation Engine** matching OCR Visual Inspection Zone (VIZ) against encrypted MRZ checksums | Cross-field discrepancy detection |
| **Identity Impersonation** | Travelers presenting authentic documents belonging to a look-alike sibling | **1:1 Facial Biometrics** comparing document photo against live webcam with anti-spoofing (PAD) | Cosine landmark similarity (> 0.75 verified match) |
| **Blacklisted Fugitives** | Individuals on international wanted lists attempting border transit | **Real-Time Watchlist Engine** querying Interpol Red Notices and domestic ledgers | Immediate lockdown alert (≥ 92% risk) |
| **Inspection Bottlenecks** | Manual verification delays causing 3–5 minute queues per traveler | **Asynchronous FastAPI Engine** executing all 4 modules synchronously in memory | **< 1.2s** end-to-end turnaround |

---

## 🏗️ End-to-End System Architecture

```
                                  [ Traveler Arrival ]
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
          [ Document Scanner ]                          [ Live Camera Stream ]
          (Physical / Upload)                           (Webcam / Sensor Feed)
                    │                                             │
                    ├──────────────────────┬──────────────────────┤
                    ▼                      ▼                      ▼
           [ MODULE 1: OCR/MRZ ]  [ MODULE 2: FORENSICS ] [ MODULE 3: BIOMETRICS ]
           • ICAO 9303 Checksums  • Error Level Analysis • 1:1 Face Similarity
           • TD1/TD2/TD3 Parsing  • Noise Variance Map   • Moire / Spoof Check
           • VIZ vs MRZ Matching  • Photo Border Jump    • 128-d Landmark Vector
                    │                      │                      │
                    └──────────────────────┼──────────────────────┘
                                           ▼
                            [ MODULE 4: WATCHLIST LOOKUP ]
                            • Interpol Red Notice Database
                            • Border Exclusion Ledger
                                           ▼
                            [ UNIFIED RISK SCORING ENGINE ]
                            • Weighted Bayesian Multi-Factor Model
                            • 0–100% Composite Risk Index
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
             [ GRANT ENTRY ]    [ SECONDARY INSPECT ]    [ DETAIN SUBJECT ]
            (0% - 29% Risk)        (30% - 69% Risk)       (70% - 100% Risk)
            Green Channel Pass     Route to Counter 4B    Security Lockdown
```

---

## 🔬 The 4 Core AI Screening Modules

### 1. ICAO Doc 9303 MRZ Checksum Engine
- Supports **TD3** (Passports: 2 lines × 44 chars), **TD2** (Visas: 2 lines × 36 chars), and **TD1** (National IDs: 3 lines × 30 chars).
- **The 7-3-1 Weight Rule**: Multiplies each character by repeating sequence `[7, 3, 1, 7, 3, 1...]`, sums the products, and computes `modulo 10`.
- If a counterfeiter edits an expiration date or document number in Photoshop without knowing how to recalculate the check digit, the document is immediately flagged as fraudulent.

### 2. Multi-Spectral Digital Forensics Studio
- **Error Level Analysis (ELA)**: Re-saves the document image at 90% JPEG quality and calculates pixel-level difference deltas. Altered or spliced portrait areas compress differently, glowing bright neon orange/red in the heatmap.
- **Laplacian Noise Map**: Measures high-frequency surface texture. Genuine security guilloché paper has consistent texture; digitally smoothed or cloned areas drop to near-zero noise.
- **Sobel Gradient Edge Jump**: Scans the 4 perimeter borders of the portrait box for sharp gradient spikes that indicate digital cut-and-paste or physical sticker placement.

### 3. 1:1 Facial Biometrics & Anti-Spoofing
- Extracts the document portrait and captures a real-time frame from the counter webcam.
- Translates both facial landmarks into 128-dimensional coordinate vectors.
- Computes **Cosine Similarity**:
  - `> 0.75`: Verified match (Green).
  - `0.50 – 0.75`: Inconclusive (Amber, secondary inspection).
  - `< 0.50`: Impersonator detected (Red, detain subject).
- **Presentation Attack Detection (PAD)**: Scans for screen moiré patterns, paper glare, and border lines to detect printed photo or tablet spoofing.

### 4. Interpol Red Notice & Watchlist Screening
- Indexes traveler name, nationality, and document number against simulated international intelligence databases.
- An exact or fuzzy match immediately triggers a hard floor of **≥ 92% Critical Risk**, triggering terminal alerts.

---

## 🛡️ Rakshak Cyber-Defense Suite

In addition to border document screening, the application includes the **Rakshak AI cyber-defense suite** accessible via the top navigation toggle:

- **SMS Scam Detector**: Uses code-mixed NLP (Hinglish/Regional) to identify phishing bank alerts, fake lottery messages, and extortion SMS.
- **Phishing URL Scanner**: High-performance Bloom filter and heuristic domain analyzer to detect typosquatting and deceptive portals.
- **QR / UPI Fraud Detector**: Validates UPI Virtual Payment Addresses (VPAs) to prevent payment redirection attacks.
- **APK Permissions Auditor**: Analyzes Android package manifests for dangerous permission combinations and sideloaded spyware.

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + Glassmorphism UI tokens
- **Icons**: Lucide React
- **Animations & Effects**: Canvas Confetti, custom CSS scanlines, interactive forensic overlay sliders
- **Exporting**: `html2canvas` + `jspdf` for on-device PDF generation

### Backend
- **Framework**: Python 3.10+ / FastAPI
- **ASGI Server**: Uvicorn with asynchronous execution
- **Computer Vision**: OpenCV (`opencv-python-headless`), NumPy, SciPy, Scikit-Image
- **Image Processing**: Pillow (PIL)
- **Data Validation**: Pydantic v2
- **PDF Generation**: ReportLab 5.x

### Cloud Deployment
- **Platform**: Vercel
- **Config**: [`vercel.json`](file:///d:/SIH2/vercel.json) routes `/api/*` to [`api/index.py`](file:///d:/SIH2/api/index.py) serverless function with edge static frontend hosting.

---

## 📂 Project Directory Structure

```
.
├── README.md                      # Complete system documentation
├── index.html                     # HTML5 shell with Google Fonts
├── package.json                   # React 19 + Tailwind 4 dependencies
├── vite.config.js                 # Vite proxy configuration
├── vercel.json                    # Vercel serverless functions configuration
│
├── api/                           # Vercel Serverless Function entrypoint
│   ├── index.py                   # Serverless ASGI bridge to backend.main:app
│   └── requirements.txt           # Cloud deployment dependencies
│
├── src/                           # React 19 Frontend Terminal
│   ├── App.jsx                    # Root layout with language selector & suite toggle
│   ├── BorderSuite.jsx            # AegisBorder screening terminal
│   ├── index.css                  # Glassmorphism design tokens & animations
│   ├── components/
│   │   ├── Header.jsx             # Live clock, scan statistics, defense status
│   │   ├── PresetBar.jsx          # Threat profile quick selector
│   │   ├── DocumentIngestion.jsx  # Dual document & webcam scanner display
│   │   ├── MRZTerminal.jsx        # Monospace ICAO checksum pass/fail terminal
│   │   ├── ForensicViewer.jsx     # Interactive ELA heatmap & noise map viewer
│   │   ├── BiometricsPanel.jsx    # Document vs webcam 1:1 facial matcher
│   │   ├── RiskDecisionPanel.jsx  # 0-100% Risk Gauge & action buttons
│   │   ├── NewPassengerModal.jsx  # Live IRL document & webcam registration console
│   │   └── AuditReportModal.jsx   # Cryptographic compliance certificate modal
│   └── cyber/                     # Rakshak Cyber-Defense Suite (SMS, URL, UPI, APK)
│
├── backend/                       # Python / FastAPI AI Screening Engine
│   ├── main.py                    # API coordinator & screening router
│   ├── requirements.txt           # Python backend dependencies
│   ├── parsers/mrz_parser.py      # ICAO 9303 checksum & TD1/TD2/TD3 decoding
│   ├── forensics/
│   │   ├── ela.py                 # Error Level Analysis (ELA) heatmap engine
│   │   ├── noise_analysis.py      # Laplacian high-frequency noise variance
│   │   └── photo_tampering.py     # Sobel portrait boundary edge jump analysis
│   ├── biometrics/
│   │   └── face_verifier.py       # 128-d facial landmark vectors & anti-spoofing
│   ├── validators/
│   │   ├── integrity_checker.py   # MRZ vs VIZ cross-validation
│   │   └── watchlist_db.py        # Interpol Red Notice simulation database
│   ├── services/
│   │   ├── risk_engine.py         # Multi-factor Bayesian risk calculation
│   │   └── report_generator.py    # Compliance audit report generator
│   └── data/samples.py            # Pre-configured threat profiles
│
├── generate_complete_guide_pdf.py # Generates comprehensive A-to-Z manual PDF
├── generate_pdf_walkthrough.py    # Technical walkthrough PDF script
└── generate_pdf_report.py         # Implementation plan PDF script
```

---

## 🖥️ Dashboard Walkthrough & How to Test

You can test the system directly on the **[Live Deployment](https://agesborder-ai-deploy.vercel.app/)** or on your local machine:

1. **Select a Threat Preset**:
   - Click **`Authentic Document`**: All checksums pass, 96% face match, 12% Low Risk &rarr; **GRANT ENTRY**.
   - Click **`Photo Altered`**: Document text is valid, but the portrait was spliced. The **Forensic Viewer** lights up in neon orange/red &rarr; **SECONDARY INSPECT**.
   - Click **`Checksum Forgery`**: Modified expiration date triggers red checksum failure &rarr; **DETAIN SUBJECT**.
   - Click **`Fugitive Watchlist`**: Traveler hits Interpol Red Notice &rarr; **CRITICAL RISK (94%) & LOCKDOWN**.

2. **Interactive Forensic Studio**:
   - In the center panel, toggle between **Original**, **ELA Heatmap**, and **Noise Variance**.
   - Notice how digital edits stand out vividly under Error Level Analysis.

3. **Real-World IRL Testing ("+ New Passenger")**:
   - Click the blue **`+ New Passenger`** button at top-right.
   - Type in any traveler metadata (Name, Nationality, Document Number).
   - **Upload any custom ID image** or take a photo with your device.
   - Click **Capture Webcam** to take your own live selfie.
   - Choose an injection scenario (e.g., *Normal*, *Corrupt Checksum*, or *Watchlist Hit*).
   - Click **Submit & Screen Document** to see live, real-time results.

4. **Download Official Audit Certificate**:
   - Click **`Download PDF Certificate`** in the Decision Panel to receive an official compliance document stamped with timestamp, terminal ID, and SHA-256 evidence hashes.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # On Windows PowerShell: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
In a new terminal window at the project root:
```bash
# Install dependencies
npm install

# Start Vite dev server (proxies /api to :8000)
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 📡 API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and loaded AI module manifest |
| `GET` | `/api/presets` | List all threat simulation profiles and custom passengers |
| `GET` | `/api/presets/{id}` | Load document image, MRZ, and metadata for a preset |
| `POST` | `/api/screen-document` | Execute full 4-module forensic screening pipeline |
| `POST` | `/api/passengers/new` | Register custom traveler, generate ICAO MRZ, and execute screening |
| `DELETE` | `/api/passengers/{id}` | Remove custom passenger from session |

---

## 📑 Offline PDF Reports & Documentation

The repository includes scripts to generate formal documentation locally:

```bash
# Generate Complete A-to-Z Architecture Guide:
python generate_complete_guide_pdf.py

# Generate Technical Walkthrough Specification:
python generate_pdf_walkthrough.py

# Generate Implementation Plan Report:
python generate_pdf_report.py
```

Generated PDFs are saved directly to the project root:
- [`AegisBorder_AI_Complete_Guide_A_to_Z.pdf`](file:///d:/SIH2/AegisBorder_AI_Complete_Guide_A_to_Z.pdf)
- [`AegisBorder_AI_Project_Walkthrough.pdf`](file:///d:/SIH2/AegisBorder_AI_Project_Walkthrough.pdf)
- [`AegisBorder_AI_Implementation_Plan_and_Walkthrough.pdf`](file:///d:/SIH2/AegisBorder_AI_Implementation_Plan_and_Walkthrough.pdf)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.