# Biometric Verification — AegisBorder AI

Real 1:1 face verification: the live passenger's face is compared against the
portrait extracted from the already-captured document image. No fake scores.
Every number in the UI and audit trail comes from real model inference on the
supplied images.

## Models

| Model | Source | Licence | Role |
|---|---|---|---|
| YuNet `face_detection_yunet_2023mar.onnx` | OpenCV Zoo | Apache-2.0 | Face detection + 5 landmarks + score |
| SFace `face_recognition_sface_2021dec.onnx` | OpenCV Zoo | Apache-2.0 | 128-d face embedding |

**Why not InsightFace ArcFace / SCRFD?** The original design asked for
ArcFace/SCRFD, but their publicly distributed pretrained weights are
**non-commercial-research-only** — unusable in a border-control deployment.
SFace and YuNet are Apache-2.0 equivalents with the same detector + recognizer
architecture. Both run through `cv2.dnn` (OpenCV als reads ONNX directly), so
no onnxruntime/insightface dependency is needed on Python 3.14.

The submission deviates from the ArcFace 512-d vector spec: SFace produces a
**128-d** embedding. This is recorded here rather than papered over.

## Pipeline

1. **Detect** — YuNet locates faces in the document image and each live frame.
   The largest face in a document image is treated as the portrait.
2. **Align** — 5-point affine warp to the standard 112×112 SFace template
   (`alignCrop`, with a landmark-based fallback).
3. **Quality gates** — per-frame: Laplacian blur, brightness, contrast, face
   size and landmark pose. A frame that fails any gate is rejected *before*
   it can influence the decision.
4. **Liveness**
   - **Passive PAD**: FFT moiré + sharpness signature on the face crop (weak
     signal, screen-replay heuristic). Explicitly **not** certified
     anti-spoofing.
   - **Active challenge** (session flow only): a randomized instruction —
     `TURN_LEFT`, `TURN_RIGHT`, or `MOVE_CLOSER` — the passenger must perform
     live. Blink is not used: YuNet's 5 landmarks have no eyelid points, so an
     EAR metric would not be a real measurement. The challenge completes only
     after enough quality-accepted frames show the required motion.
5. **Embed + compare** — SFace 128-d embeddings, L2-normalized, compared with
   cosine similarity.
6. **Decide** — three bands (see below). Gates run first: a high score
   cannot bypass a failed liveness or quality check.

## Decision bands

Similarity is mapped onto three outcomes; a borderline match is never
auto-accused of fraud:

| Band | Condition (cosine) | Outcome |
|---|---|---|
| VERIFIED | `>= BIOMETRIC_HIGH_THRESHOLD` | `verified: true` |
| REVIEW | `>= BIOMETRIC_LOW_THRESHOLD` | manual human review |
| MISMATCH | `< BIOMETRIC_LOW_THRESHOLD` | fraud suspicion |

Gates emit machine-readable codes: `NO_FACE`, `MULTIPLE_FACES`,
`LOW_IMAGE_QUALITY`, `DOCUMENT_FACE_NOT_FOUND`, `DOCUMENT_FACE_QUALITY_LOW`,
`LIVENESS_FAILED`, `BIOMETRIC_ENGINE_UNAVAILABLE`, `INVALID_IMAGE`.

## Calibration — you MUST run this before trusting thresholds

The defaults `BIOMETRIC_HIGH_THRESHOLD=0.45`, `BIOMETRIC_LOW_THRESHOLD=0.30`
are **starting values, not validated**. Calibrate on an identity-mismatched
face dataset you are legally allowed to use (never commit real passports):

```bash
cd backend
tree dataset/genuine   # doc/<id>.jpg  +  live/<id>.jpg  (same person per <id>)
venv/Scripts/python.exe -m evaluation.evaluate_biometric \
  --genuine dataset/genuine --fmr-target 0.02
```

The CLI runs the real engine on every pair and reports FMR, FNMR, TAR, TRR,
EER, and a threshold for the configured FMR target — computed, never invented.
If the target is not met on your data it says so instead of claiming
compliance. **Never claim an error rate below what you have measured on your
own dataset.**

## API

| Endpoint | Purpose |
|---|---|
| `POST /api/biometric/session` | Start session; server keeps the document portrait in memory (never on disk), issues a random active-liveness challenge. |
| `POST /api/biometric/liveness` | Feed one camera frame; server quality-gates it and scores it against the challenge. |
| `POST /api/biometric/verify` | Final compare. Session path requires the passed active challenge; no-session path is passive-only (used by the screening pipeline). |
| `GET /api/biometric/status` | Model availability + threshold. Never claims the engine is ready when it is not. |

The framed images are decoded by `biometrics.utils.decode_b64_image` which
checks size limits and magic bytes before cv2/PIL ever sees them.

## Privacy & retention

- Raw face / document images live **only in memory**; nothing is written to disk.
- Audit events (sanitized JSONL at `backend/data/biometric_audit.jsonl`)
  contain decisions and scores, **never** images, embeddings, or names.
- Sessions expire after `BIOMETRIC_SESSION_TTL_S` (180 s) and are purged on
  access; at most `BIOMETRIC_MAX_SESSIONS` (50) concurrent.

## Known limitations (documented, not hidden)

- YuNet's 5 landmarks cannot measure occlusion or eyelid state.
- Passive PAD is a heuristic (FFT moiré) and must not be marketed as
  certified anti-spoofing.
- SFace (128-d, 2021) is a smaller recognizer than ArcFace (512-d); expect a
  lower ceiling on hard cohorts. Validate with your own evaluation set.
- Webcam deployment requires HTTPS/good lighting; the active challenge needs a
  user to face the camera for a few seconds.

## Configuration

All knobs are environment variables with safe defaults in
`backend/biometrics/config.py` (see `BIOMETRIC_*`):

- `BIOMETRIC_HIGH_THRESHOLD`, `BIOMETRIC_LOW_THRESHOLD` — decision bands
- `BIOMETRIC_MIN_BLUR`, `BIOMETRIC_BRIGHTNESS_*`, `BIOMETRIC_CONTRAST_MIN`,
  `BIOMETRIC_LIVE_MIN_FACE_RATIO`, `BIOMETRIC_DOC_MIN_FACE_RATIO`,
  `BIOMETRIC_MAX_YAW_PROXY` — quality gates
- `BIOMETRIC_LIVENESS_YAW_DELTA`, `BIOMETRIC_LIVENESS_CLOSER_FACTOR`,
  `BIOMETRIC_LIVENESS_MIN_FRAMES`, `BIOMETRIC_LIVENESS_MAX_SKIPPED`,
  `BIOMETRIC_LIVENESS_TIMEOUT_S` — active challenge
- `BIOMETRIC_SESSION_TTL_S`, `BIOMETRIC_MAX_SESSIONS` — session bounds
- `BIOMETRIC_MAX_IMAGE_BYTES` — upload cap (8 MB)
- `AUDIT_LOG_PATH` — sanitized audit log location

## Run

```bash
cd backend
venv/Scripts/python.exe -m uvicorn main:app --reload   # engine loads on startup

# tests (stdlib unittest, no extra deps)
venv/Scripts/python.exe -m unittest discover -s tests -t .

# frontend
npm run dev       # or npm run build / npm run lint
```

If the models fail to load the API reports `BIOMETRIC_ENGINE_UNAVAILABLE`
per-request and never fabricates a pass.