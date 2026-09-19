from datetime import datetime
from typing import Dict, Any, List, Optional

def validate_integrity(mrz_data: Optional[Dict[str, Any]], viz_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Module 2: Document Validation
    - Verifies format compliance and cross-checks MRZ data vs VIZ (Visual Inspection Zone)
    - Validates date chronology and expiration status
    """
    discrepancies: List[Dict[str, Any]] = []
    checks_passed = 0
    total_checks = 0
    
    # 1. Check Expiry
    is_expired = False
    expiry_date_str = None
    if mrz_data and mrz_data.get("date_of_expiry"):
        expiry_date_str = mrz_data["date_of_expiry"]
    elif viz_data and viz_data.get("date_of_expiry"):
        expiry_date_str = viz_data["date_of_expiry"]
        
    if expiry_date_str:
        total_checks += 1
        try:
            exp_dt = datetime.strptime(expiry_date_str, "%Y-%m-%d")
            now = datetime.now()
            if exp_dt < now:
                is_expired = True
                discrepancies.append({
                    "field": "Document Expiration",
                    "severity": "CRITICAL",
                    "description": f"Document expired on {expiry_date_str} ({int((now - exp_dt).days)} days ago)",
                    "category": "Temporal"
                })
            else:
                checks_passed += 1
        except Exception:
            pass

    # 2. Cross-Verification: Document Number (MRZ vs VIZ)
    if mrz_data and viz_data and mrz_data.get("document_number") and viz_data.get("document_number"):
        total_checks += 1
        mrz_doc = mrz_data["document_number"].strip().upper()
        viz_doc = viz_data["document_number"].strip().upper()
        if mrz_doc != viz_doc:
            discrepancies.append({
                "field": "Document Number Mismatch",
                "severity": "CRITICAL",
                "description": f"MRZ value '{mrz_doc}' does not match Visual Zone value '{viz_doc}'",
                "mrz_val": mrz_doc,
                "viz_val": viz_doc,
                "category": "Cross-Field Integrity"
            })
        else:
            checks_passed += 1

    # 3. Cross-Verification: Date of Birth (MRZ vs VIZ)
    if mrz_data and viz_data and mrz_data.get("date_of_birth") and viz_data.get("date_of_birth"):
        total_checks += 1
        mrz_dob = mrz_data["date_of_birth"].strip()
        viz_dob = viz_data["date_of_birth"].strip()
        # Direct or fuzzy date match
        if mrz_dob != viz_dob and mrz_dob.replace("-", "") != viz_dob.replace("-", ""):
            discrepancies.append({
                "field": "Date of Birth Mismatch",
                "severity": "HIGH",
                "description": f"MRZ DOB '{mrz_dob}' differs from printed VIZ DOB '{viz_dob}'",
                "mrz_val": mrz_dob,
                "viz_val": viz_dob,
                "category": "Cross-Field Integrity"
            })
        else:
            checks_passed += 1

    # 4. Cross-Verification: Name Consistency
    if mrz_data and viz_data and mrz_data.get("full_name") and viz_data.get("full_name"):
        total_checks += 1
        mrz_name = mrz_data["full_name"].strip().upper().replace(" ", "")
        viz_name = viz_data["full_name"].strip().upper().replace(" ", "")
        if mrz_name != viz_name and mrz_name not in viz_name and viz_name not in mrz_name:
            discrepancies.append({
                "field": "Name Inconsistency",
                "severity": "HIGH",
                "description": f"MRZ name '{mrz_data['full_name']}' does not correspond to VIZ '{viz_data['full_name']}'",
                "category": "Cross-Field Integrity"
            })
        else:
            checks_passed += 1

    # 5. Check MRZ Checksums status
    if mrz_data and "checksums" in mrz_data:
        for cname, cinfo in mrz_data["checksums"].items():
            if isinstance(cinfo, dict) and "valid" in cinfo:
                total_checks += 1
                if not cinfo["valid"]:
                    discrepancies.append({
                        "field": f"MRZ Check Digit ({cname.replace('_', ' ').title()})",
                        "severity": "CRITICAL",
                        "description": f"Invalid ICAO 9303 checksum: Extracted '{cinfo.get('extracted')}', Expected '{cinfo.get('calculated')}'",
                        "category": "ICAO Doc 9303 Standard"
                    })
                else:
                    checks_passed += 1

    # Compute validation confidence score
    validation_score = (checks_passed / total_checks * 100.0) if total_checks > 0 else 100.0
    if any(d["severity"] == "CRITICAL" for d in discrepancies):
        validation_score = min(validation_score, 30.0)

    return {
        "is_valid": len(discrepancies) == 0,
        "is_expired": is_expired,
        "validation_score": float(round(validation_score, 1)),
        "checks_passed": checks_passed,
        "total_checks": total_checks,
        "discrepancies": discrepancies
    }
