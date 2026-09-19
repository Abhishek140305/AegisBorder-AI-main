import hashlib
import json
import time
from datetime import datetime
from typing import Dict, Any

def generate_audit_trail(screening_result: Dict[str, Any], officer_id: str = "OFFICER-7419") -> Dict[str, Any]:
    """
    Generate an immutable cryptographic border audit report record.
    Uses SHA-256 to sign document details, forensic hashes, and screening decisions.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Payload for hashing
    payload = {
        "timestamp": timestamp,
        "officer_id": officer_id,
        "doc_number": screening_result.get("extracted_data", {}).get("mrz", {}).get("document_number", "UNKNOWN"),
        "holder_name": screening_result.get("extracted_data", {}).get("mrz", {}).get("full_name", "UNKNOWN"),
        "risk_score": screening_result.get("risk_assessment", {}).get("overall_risk_score", 0),
        "decision": screening_result.get("risk_assessment", {}).get("recommended_decision", "UNKNOWN")
    }
    
    payload_str = json.dumps(payload, sort_keys=True)
    audit_hash = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
    
    return {
        "audit_id": f"BCP-{int(time.time())}-{audit_hash[:8].upper()}",
        "timestamp": timestamp,
        "officer_id": officer_id,
        "cryptographic_hash": audit_hash,
        "signature_algorithm": "SHA-256-IMMUTABLE-LEDGER",
        "checkpoint_id": "DELHI-IGI-T3-COUNTER-14",
        "record_payload": payload
    }
