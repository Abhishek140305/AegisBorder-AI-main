import json
import sys
import urllib.request
import urllib.error

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
FAILURES = []

def check(name, cond, detail=""):
    mark = "PASS" if cond else "FAIL"
    if not cond:
        FAILURES.append(name)
    print(f"  [{mark}] {name}" + (f" -- {detail}" if detail and not cond else ""))

def get(path):
    with urllib.request.urlopen(BASE + path, timeout=60) as r:
        return json.loads(r.read().decode())

def post(path, payload=None, raw=None):
    data = raw if raw is not None else json.dumps(payload).encode()
    headers = {} if raw is not None else {"Content-Type": "application/json"}
    req = urllib.request.Request(BASE + path, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read().decode())

def delete(path):
    req = urllib.request.Request(BASE + path, method="DELETE")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

print("== 1. Health + module manifest ==")
h = get("/api/health")
check("health modules_active non-empty", isinstance(h.get("modules_active"), list) and len(h["modules_active"]) > 0, str(h.get("modules_active")))
check("health version present", bool(h.get("version")))
for stale in [p["id"] for p in get("/api/presets").get("presets", []) if p.get("is_custom")]:
    delete("/api/passengers/" + stale)

print("== 2. Presets list ==")
presets = get("/api/presets").get("presets", [])
check("5+ presets returned", len(presets) >= 5, str(len(presets)))
check("preset card fields", all(p.get("id") and p.get("holder_name") and p.get("document_type") for p in presets))

print("== 3. Preset detail (image + MRZ) ==")
pd = get("/api/presets/" + presets[0]["id"])
check("preset detail image_b64", bool(pd.get("image_b64")), str(pd.get("id")))
check("preset detail mrz_raw", bool(pd.get("mrz_raw")))
check("built-in detail carries no live image", not pd.get("live_passenger_b64"))

print("== 4. screen-document full 7-section response ==")
s = post("/api/screen-document", {"preset_id": presets[0]["id"]})
check("success flag", s.get("success") is True)
check("extracted_data.mrz", s.get("extracted_data", {}).get("mrz") is not None)
check("extracted_data.viz", isinstance(s.get("extracted_data", {}).get("viz"), dict))
check("document_validation", isinstance(s.get("document_validation"), dict) and "validation_score" in s["document_validation"])
check("watchlist_screening", isinstance(s.get("watchlist_screening"), dict) and "flagged" in s["watchlist_screening"])
fx = s.get("forensics", {})
check("forensics.summary scores", all(k in fx.get("summary", {}) for k in ("ela_score", "noise_discrepancy_score", "photo_tamper_score", "metadata_tamper_score")))
vis = fx.get("visuals", {})
check("forensics 4 visual overlays", all(vis.get(k) for k in ("original", "ela_heatmap", "noise_map", "edge_gradient_map")), str(list(vis.keys())))
bio = s.get("biometrics", {})
check("biometrics match + liveness", "match_score" in bio and "liveness" in bio)
ra = s.get("risk_assessment", {})
check("risk score 0-100", 0 <= ra.get("overall_risk_score", -1) <= 100)
check("risk tier decision + components + factors", all(k in ra for k in ("risk_tier", "recommended_decision", "component_scores", "risk_factors")))
ar = s.get("audit_report", {})
check("audit_report BCP- id", str(ar.get("audit_id", "")).startswith("BCP-"), str(ar.get("audit_id")))

print("== 5. Tampered preset flags tampering ==")
tm = post("/api/screen-document", {"preset_id": "preset_photo_tampered"})
check("tampered preset high risk", tm.get("risk_assessment", {}).get("overall_risk_score", 0) >= 60, str(tm.get("risk_assessment", {}).get("overall_risk_score")))

print("== 6. passenger register + auto-screen (with live image) ==")
TINY_JPEG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCg/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAxAAAB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k="
reg = post("/api/passengers/new", {
    "holder_name": "VERIFY TEST USER", "doc_number": "ABC123456", "nationality": "IND",
    "dob": "1990-08-06", "expiry": "2030-01-01", "sex": "Female", "tamper_scenario": "none",
    "live_passenger_b64": TINY_JPEG
})
check("registration success + passenger id", reg.get("success") is True, reg.get("message", ""))
pid = reg.get("passenger", {}).get("id")
check("passenger has live image echo", bool(reg.get("passenger", {}).get("live_passenger_b64")))
sr = reg.get("screening_result", {})
check("auto-screen ran (risk)", sr.get("risk_assessment", {}).get("overall_risk_score") is not None)
check("biometrics section returned", "match_score" in sr.get("biometrics", {}))
check("audit trail attached to auto-screen", str(sr.get("audit_report", {}).get("audit_id", "")).startswith("BCP-"))
check("custom passenger listed", pid in [p["id"] for p in get("/api/presets").get("presets", []) if p.get("is_custom")])

print("== 7. delete custom passenger ==")
plugin = pid
del_res = delete("/api/passengers/" + plugin)
check("delete accepted", del_res.get("success") is True, str(del_res)[:120])
pids2 = [p["id"] for p in get("/api/presets").get("presets", []) if p.get("is_custom")]
check("passenger actually removed", plugin not in pids2)

print()
if FAILURES:
    print(f"FAILED HTTP VERIFICATION: {len(FAILURES)} -> {FAILURES}")
    sys.exit(1)
print("ALL ENDPOINTS VERIFIED")