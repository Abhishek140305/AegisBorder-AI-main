"""Command-line biometric evaluation & threshold calibration.

Usage (run from backend/):

    python -m evaluation.evaluate_biometric --genuine ./dataset/genuine --impostor ./dataset/impostor

Dataset layout (identical in both directories):

    <dir>/doc/<id>.<jpg|png>     document portrait of person <id>
    <dir>/live/<id>.<jpg|png>    live photo of person <id>

Genuine pairs are matched doc/live pairs with the same <id>.
Impostor pairs are every cross (doc_A, live_B) with A != B.
Only test data that you are legally entitled to use may be placed here; never
commit real passports or biometric data to Git.

Output: FMR, FNMR, TAR, TRR at the calibrated threshold, plus the EER and a
threshold chosen for the configured FMR target (2% by default). Numbers are
computed from the actual engine on the supplied data — never invented.
"""
import argparse
import glob
import os
import sys

import numpy as np

# allow `python -m evaluation.evaluate_biometric` from the backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from biometrics.engine import initialize_engine, get_engine  # noqa: E402
from biometrics.similarity import cosine_similarity  # noqa: E402


def load_pairs(root: str):
    """Return {id: dict(doc=path, live=path)} for matching filenames."""
    doc_dir = os.path.join(root, "doc")
    live_dir = os.path.join(root, "live")
    if not (os.path.isdir(doc_dir) and os.path.isdir(live_dir)):
        raise SystemExit("Dataset directory must contain doc/ and live/ subdirectories: %s" % root)
    docs = {os.path.splitext(os.path.basename(p))[0]: p for p in glob.glob(os.path.join(doc_dir, "*"))}
    lives = {os.path.splitext(os.path.basename(p))[0]: p for p in glob.glob(os.path.join(live_dir, "*"))}
    ids = sorted(set(docs) & set(lives))
    return [{"id": i, "doc": docs[i], "live": lives[i]} for i in ids]


def _read(p):
    import cv2

    img = cv2.imread(p)
    if img is None:
        return None
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def embed(engine, rgb):
    if rgb is None:
        return None
    faces = engine.detect(rgb)
    if not faces:
        return None
    face = max(faces, key=lambda f: f["bbox"]["width"] * f["bbox"]["height"])
    return engine.embedding(rgb, face)


def evaluate(pairs, impostor_pairs, fmr_target=0.02, quiet=False):
    engine = get_engine()
    if not engine.ready:
        raise SystemExit("Biometric engine failed to initialize: %s" % engine.init_error)

    genuine, impostor = [], []
    skipped_gen, skipped_imp = 0, 0
    for p in pairs:
        d, l = embed(engine, _read(p["doc"])), embed(engine, _read(p["live"]))
        if d is None or l is None:
            skipped_gen += 1
            continue
        genuine.append(cosine_similarity(d, l))
    for p in impostor_pairs:
        d, l = embed(engine, _read(p["doc"])), embed(engine, _read(p["live"]))
        if d is None or l is None:
            skipped_imp += 1
            continue
        impostor.append(cosine_similarity(d, l))

    if not genuine or not impostor:
        raise SystemExit("Not enough comparable pairs (genuine=%d, impostor=%d)." % (len(genuine), len(impostor)))

    g = np.asarray(genuine, dtype=np.float64)
    i = np.asarray(impostor, dtype=np.float64)

    # Threshold grid: coarse -> fine around candidate range.
    grid = np.unique(np.concatenate([np.arange(-1.0, 1.0, 0.001), g, i]))
    fnmr = np.array([np.mean(g < t) for t in grid])
    fmr = np.array([np.mean(i >= t) for t in grid])
    diff = np.abs(fnmr - fmr)
    eer_idx = int(np.argmin(diff))
    eer = float((fmr[eer_idx] + fnmr[eer_idx]) / 2.0)

    # Threshold for the FMR target (if achievable), else for the lowest achieved FMR.
    below = grid[fmr <= fmr_target]
    if len(below):
        cal_threshold = float(below[-1])
        fmr_at = float(np.mean(i >= cal_threshold))
    else:
        best = int(np.argmin(fmr))
        cal_threshold = float(grid[best])
        fmr_at = float(fmr[best])
    fnmr_at = float(np.mean(g < cal_threshold))
    tar = 1.0 - fnmr_at
    trr = 1.0 - fmr_at

    if not quiet:
        print("# Biometric Evaluation (real inference, no fabricated numbers)")
        print("Model: YuNet + SFace (OpenCV Zoo, Apache-2.0)")
        print()
        print("Genuine pairs scored : %d" % len(genuine))
        print("Impostor pairs scored: %d" % len(impostor))
        print("Skipped (no face)    : genuine=%d impostor=%d" % (skipped_gen, skipped_imp))
        print()
        print("Similarity stats (genuine): mean=%.4f std=%.4f med=%.4f" % (float(g.mean()), float(g.std()), float(np.median(g))))
        print("Similarity stats (impostor): mean=%.4f std=%.4f med=%.4f" % (float(i.mean()), float(i.std()), float(np.median(i))))
        print()
        print("Equal Error Rate        : %.4f%% (threshold %.4f)" % (eer * 100.0, float(grid[eer_idx])))
        print("FMR target              : %.2f%%" % (fmr_target * 100.0))
        print("Calibrated threshold    : %.4f" % cal_threshold)
        print("FMR at threshold        : %.4f%%" % (fmr_at * 100.0))
        print("FNMR at threshold       : %.4f%%" % (fnmr_at * 100.0))
        print("True Accept Rate (TAR)  : %.4f%%" % (tar * 100.0))
        print("True Reject Rate (TRR)  : %.4f%%" % (trr * 100.0))
        print()
        if fnmr_at * 100.0 >= 2.0 or fmr_at * 100.0 >= 2.0:
            print("NOTE: the <2%% error target was NOT met on this dataset; the measured")
            print("values above are what the system actually achieved.")
    return {"genuine": g, "impostor": i, "cal_threshold": cal_threshold, "fmr": fmr_at, "fnmr": fnmr_at, "tar": tar, "trr": trr, "eer": eer}


def main():
    ap = argparse.ArgumentParser(description="AegisBorder biometric evaluation & calibration")
    ap.add_argument("--genuine", required=True, help="dir containing doc/ and live/ subdirs (matched same-identity pairs)")
    ap.add_argument("--impostor", default=None, help="dir for impostor pairs (omit to derive cross pairs from --genuine)")
    ap.add_argument("--fmr-target", type=float, default=0.02, help="false-match-rate target (default 0.02 = 2%%)")
    args = ap.parse_args()

    initialize_engine()
    pairs = load_pairs(args.genuine)
    impostor_dir = args.impostor or args.genuine
    all_pairs = load_pairs(impostor_dir)
    ids = {p["id"] for p in pairs}
    impostor_pairs = [
        {"id": "%s__%s" % (p["id"], q["id"]), "doc": p["doc"], "live": q["live"]}
        for p in all_pairs
        for q in all_pairs
        if p is not q
    ]
    if not pairs:
        raise SystemExit("No matched doc/live pairs found in %s" % args.genuine)
    evaluate(pairs, impostor_pairs, fmr_target=args.fmr_target)


if __name__ == "__main__":
    main()