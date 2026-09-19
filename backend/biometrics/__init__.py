"""Biometric verification subsystem for AegisBorder.

Real 1:1 face verification pipeline: camera/document detection -> alignment ->
quality gates -> active liveness -> SFace embedding -> cosine similarity ->
calibrated decision bands.

Legality: the InsightFace/ArcFace/SCRFD pretrained weights are published for
non-commercial research only. This prototype therefore uses the Apache-2.0
OpenCV Zoo models (YuNet detector + SFace recognizer, see BIOMETRIC.md).
"""