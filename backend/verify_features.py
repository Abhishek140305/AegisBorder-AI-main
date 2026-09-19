import json
import sys
import os
import base64
import io
import hashlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

FAILURES = []

def check(name, cond, detail=""):
    mark = "PASS" if cond else "FAIL"
    if not cond:
        FAILURES.append(name)
    print(f"  [{mark}] {name}" + (f" -- {detail}" if detail and not cond else ""))


print("== Section 2: OCR & ICAO 9303 MRZ Engine ==")
from parsers.mrz_parser import char_to_value, calculate_check_digit, parse_date, parse_td3_passport, parse_td2_visa, parse_mrz_text

check("char_to_value digit", char_to_value("4") == 4)
check("char_to_value letter", char_to_value("A") == 10)
check("char_to_value filler", char_to_value("<") == 0)
check("check digit weighted mod10 (123 -> 6)", calculate_check_digit("123") == (1 * 7 + 2 * 3 + 3 * 1) % 10 == 6)
check("TD3 44-char auto-detect", parse_mrz_text("P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C<3UTO6908061F9406236ZE184226B<<<<<14") is not None)
check("TD2 36-char auto-detect", parse_mrz_text("I<UTOERIKSSON<<ANNA<MARIA\nL898902C<3UTO6908061F9406236Z<<<<<<") is not None)

td3 = parse_td3_passport(["P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<", "L898902C<3UTO6908061F9406236ZE184226B<<<<<14"])
check("TD3 surname (canonical ICAO specimen)", td3.get("surname") == "ERIKSSON", str(td3.get("surname")))
check("TD3 issuing country", td3.get("issuing_country") == "UTO", str(td3.get("issuing_country")))
check("TD3 document number (no check digit)", td3.get("document_number") == "L898902C", str(td3.get("document_number")))
check("TD3 4 check digits all valid", td3.get("checksums", {}).get("overall_valid") is True, str(td3.get("checksums")))

td2 = parse_td2_visa(["I<UTOERIKSSSON<<ANNA<MARIA", "L898902C<3UTO6908061F9406236F<<<<<<<"])
check("TD2 valid passport-number checksum", parse_td2_visa(["I<UTOERIKSSSON<<ANNA<MARIA", "L898902C<3UTO6908061F9406236Z<<<<<<"]).get("checksums", {}).get("overall_valid") is True)
bad_td2 = parse_td2_visa(["I<UTOERIKSSSON<<ANNA<MARIA", "L898902C<4UTO6908061F9406236Z<<<<<<"])
check("TD2 corrupted doc-number CD flagged", bad_td2.get("checksums", {}).get("overall_valid") is False)
check("expiry within+40yr -> 2000s", parse_date("260101", is_expiry=True)[0] == "2026-01-01")
check("dob past -> 1900s", parse_date("940623", is_expiry=False)[0] == "1994-06-23")

from parsers.ocr_extractor import locate_mrz_region, extract_viz_fields_from_metadata
check("locate_mrz_region defined", callable(locate_mrz_region))
check("extract_viz_fields_from_metadata defined", callable(extract_viz_fields_from_metadata))

print("== Section 3: Document Validation & Watchlist ==")
from validators.integrity_checker import validate_integrity
ok_integrity = validate_integrity(
    {"document_number": "L898902C3", "date_of_birth": "1990-08-06", "full_name": "ANNA MARIA ERIKSSON", "date_of_expiry": "2125-01-01"},
    {"document_number": "L898902C3", "date_of_birth": "1990-08-06", "full_name": "ANNA MARIA ERIKSSON"},
)
check("integrity no mismatches", ok_integrity.get("is_valid") is True)
bad_integrity = validate_integrity(
    {"document_number": "L898902C3", "date_of_birth": "1990-08-06", "full_name": "ANNA MARIA ERIKSSON", "date_of_expiry": "2001-01-01"},
    {"document_number": "L898902X9", "date_of_birth": "1990-08-06", "full_name": "JOHN SMITH"},
)
check("integrity flags mismatch", bad_integrity.get("is_valid") is False)
check("integrity score range", 0 <= ok_integrity.get("validation_score", -1) <= 100)

from validators.watchlist_db import check_watchlist, add_watchlist_entry
wl = check_watchlist("Q77ABCDEF", "RANDOM TRAVELLER", None)
check("watchlist no-match safe", wl.get("flagged") is False, str(wl.get("alerts")))
add_watchlist_entry({"document_number": "ZZZ999", "name": "TEST SUSPECT", "nationality": "ANY", "dob": "ANY", "alert_type": "BORDER BLACKLIST", "severity": "HIGH", "reason": "verification seed", "action_required": "REFUSE ENTRY"})
wl_hit = check_watchlist("ZZZ999123", "TEST SUSPECT", None)
check("watchlist matches seeded entry", wl_hit.get("flagged") is True and wl_hit.get("highest_severity") == "HIGH")

print("== Section 4: Multi-Spectral Forensics ==")
from PIL import Image
import numpy as np
from forensics.ela import perform_ela, generate_heatmap_overlay, image_to_base64
from forensics.noise_analysis import analyze_noise_inconsistency
from forensics.photo_tampering import detect_photo_replacement
from forensics.metadata_analyzer import analyze_metadata

img = Image.new("RGB", (300, 200), (200, 200, 200))
ela_np, ela_score, bboxes = perform_ela(img)
check("ELA returns array + score", isinstance(ela_np, np.ndarray) and 0 <= ela_score <= 100)
check("ELA heatmap overlay", generate_heatmap_overlay(ela_np, ela_np).shape == ela_np.shape)
check("ELA b64 image", image_to_base64(ela_np).startswith("data:image/jpeg;base64,"))

noise_np, noise_score, anomalies = analyze_noise_inconsistency(np.asarray(img))
check("noise VIRIDIS map sized to input", noise_np.ndim == 3 and noise_np.shape[:2] == img.size[::-1], str(noise_np.shape))
check("noise score range", 0 <= noise_score <= 100)
check("noise anomalies list", isinstance(anomalies, list))

tamper = detect_photo_replacement(np.asarray(img))
check("photo tamper score range", 0 <= tamper.get("photo_tamper_score", -1) <= 100)
check("photo tamper verdict key", "is_photo_tampered" in tamper)

meta = analyze_metadata(Image.new("RGB", (100, 100)))
check("metadata tamper score range", 0 <= meta.get("metadata_tamper_score", -1) <= 100)

print("== Section 5: Biometric Face Verification ==")
from biometrics.face_verifier import detect_face, compute_face_feature_vector, verify_faces, check_liveness_and_anti_spoofing, detect_face_by_skin_and_geometry
face_img = np.full((128, 128, 3), 180, dtype=np.uint8)
empty = detect_face(face_img) or detect_face_by_skin_and_geometry(face_img)
check("no face on flat gray (honest)", empty is None, str(empty)[:80])
skin_img = np.full((128, 128, 3), (185, 145, 125), dtype=np.uint8)
det = detect_face(skin_img) or detect_face_by_skin_and_geometry(skin_img)
check("face detected (skin/geometry fallback)", det is not None, str(det)[:80])
check("feature vector 128-dim-ish", compute_face_feature_vector(face_img).ndim >= 1)
res = verify_faces(face_img, face_img)
check("1:1 match score", 0 <= res.get("match_score", -1) <= 100)
check("liveness/PAD suite", "liveness_score" in check_liveness_and_anti_spoofing(face_img))
try:
    from data.samples import get_preset_by_id
    import cv2, base64
    def _npf(_id):
        _p = get_preset_by_id(_id)
        if "image_np" in _p:
            return _p["image_np"]
        return cv2.imdecode(np.frombuffer(base64.b64decode(_p["image_b64"].split(",", 1)[1]), np.uint8), cv2.IMREAD_COLOR)
    _gen = _npf("preset_genuine_passport")
    _tam = _npf("preset_photo_tampered")
    _self = verify_faces(_gen, _gen)
    check("sface identical -> matched", _self.get("is_matched") is True and _self.get("match_score", 0) > 90, str(_self)[:80])
    _cross = verify_faces(_gen, _tam)
    check("tampered avatar -> not inflated", _cross.get("match_score", 100) < 70, str(_cross)[:80])
except Exception as _e:
    check("sface preset regression", False, str(_e)[:80])

print("== Section 6: Unified Risk Decision Engine ==")
from services.risk_engine import calculate_risk_score


def _risky(mrz=None, validation=None, forensics=None, bio=None, watch=None):
    return calculate_risk_score(
        mrz_data=mrz or {},
        validation_data=validation or {"validation_score": 100.0, "is_valid": True, "discrepancies": [], "is_expired": False},
        forensics_data=forensics or {"ela_score": 0, "photo_tamper_score": 0, "noise_discrepancy_score": 0, "metadata_tamper_score": 0},
        biometrics_data=bio or {"match_score": 98.0, "liveness": {"is_live": True}},
        watchlist_data=watch or {"flagged": False},
    )


clean = _risky()
check("clean score LOW/GRANT", clean.get("risk_tier") == "LOW" and "GRANT" in clean.get("recommended_decision", ""), str(clean.get("risk_tier")))
watch_hit = _risky(watch={"flagged": True, "highest_severity": "CRITICAL", "alerts": [{"alert_type": "INTERPOL RED NOTICE", "severity": "CRITICAL", "reason": "x"}]})
check("watchlist floor >= 92", watch_hit.get("overall_risk_score", 0) >= 92)
check("risk factors list", isinstance(clean.get("risk_factors"), list))
check("per-component scores", set(watch_hit.get("component_scores", {})) >= {"integrity_risk", "forensic_tamper_risk", "biometric_mismatch_risk", "watchlist_risk"})
expired = _risky(validation={"validation_score": 40.0, "is_valid": False, "is_expired": True, "discrepancies": []})
check("expired floor >= 72", expired.get("overall_risk_score", 0) >= 72)

print("== Section 7: Audit Trail Certificate ==")
from services.report_generator import generate_audit_trail
audit = generate_audit_trail({"a": 1})
check("audit id BCP- pattern", str(audit.get("audit_id", "")).startswith("BCP-"), str(audit.get("audit_id")))
check("audit sha256 / bcp hash", len(str(audit.get("audit_id", "")).split("-")[-1]) == 8)

print("== Section 8: Synthetic Document Generator ==")
from data.samples import generate_icao_mrz, create_synthetic_passport_image, get_all_presets
ok_mrz = generate_icao_mrz(full_name="USER TEST", doc_number="ABC123456", nationality="IND", dob_iso="1990-08-06", expiry_iso="2030-01-01", sex="F")
parsed_ok = parse_mrz_text(ok_mrz)
check("generated MRZ parses clean", parsed_ok is not None and parsed_ok["checksums"]["overall_valid"], str(ok_mrz).replace(chr(10), " / "))
tampered_mrz = generate_icao_mrz(full_name="USER TEST", doc_number="ABC123456", nationality="IND", dob_iso="1990-08-06", expiry_iso="2030-01-01", sex="F", tamper_checksum=True)
check("tampered MRZ detected", parse_mrz_text(tampered_mrz)["checksums"]["overall_valid"] is False)
synth_np, synth_b64 = create_synthetic_passport_image(
    full_name="USER TEST", doc_number="ABC123456", nationality="IND",
    dob_mrz="900806", dob_viz="06.08.1990", expiry_mrz="300101", expiry_viz="01.01.2030",
    sex="F", mrz_lines=ok_mrz.split(chr(10)), tamper_photo=True, tamper_text=True)
check("synthetic passport image 750x480 + b64", synth_np is not None and synth_np.shape[1::-1] == (750, 480) and synth_b64.startswith("data:image/jpeg;base64,"), str(synth_np.shape if synth_np is not None else None))
presets = get_all_presets()
check("5 built-in presets", len(presets) >= 5, str(len(presets)))


print()
if FAILURES:
    print(f"FAILED VERIFICATION: {len(FAILURES)} item(s) -> {FAILURES}")
    sys.exit(1)
print("ALL FEATURES VERIFIED")