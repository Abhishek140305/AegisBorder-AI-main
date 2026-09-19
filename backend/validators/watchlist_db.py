from typing import Dict, Any, Optional, List

WATCHLIST_RECORDS = [
    {
        "document_number": "L898902C3",
        "name": "VIKTOR KORSHIKOV",
        "nationality": "RUS",
        "dob": "1974-08-12",
        "alert_type": "INTERPOL RED NOTICE",
        "severity": "CRITICAL",
        "reason": "Transnational Identity Fraud & Document Counterfeiting",
        "action_required": "IMMEDIATE DETENTION"
    },
    {
        "document_number": "E10948291",
        "name": "MARCO ALVAREZ",
        "nationality": "COL",
        "dob": "1982-11-04",
        "alert_type": "BORDER BLACKLIST",
        "severity": "HIGH",
        "reason": "Previous Entry Ban & Impersonation Attempt",
        "action_required": "REFUSE ENTRY & ESCORT"
    },
    {
        "document_number": "STOLEN882",
        "name": "ANY",
        "nationality": "ANY",
        "dob": "ANY",
        "alert_type": "STOLEN BLANK DOCUMENT",
        "severity": "CRITICAL",
        "reason": "Series reported stolen from issuing authority depot",
        "action_required": "DETAIN & CONFISCATE"
    }
]

def check_watchlist(document_number: Optional[str], full_name: Optional[str], dob: Optional[str]) -> Dict[str, Any]:
    """Screen document and passenger against border watchlist"""
    if not document_number and not full_name:
        return {"flagged": False, "alerts": []}
        
    doc_clean = (document_number or "").upper().replace(" ", "")
    name_clean = (full_name or "").upper().replace(" ", "")
    
    matched_alerts = []
    
    for record in WATCHLIST_RECORDS:
        match_doc = record["document_number"] == doc_clean or (record["document_number"] != "ANY" and record["document_number"] in doc_clean)
        match_name = record["name"] != "ANY" and (record["name"].replace(" ", "") in name_clean or name_clean in record["name"].replace(" ", ""))
        
        if match_doc or match_name:
            matched_alerts.append({
                "alert_type": record["alert_type"],
                "severity": record["severity"],
                "reason": record["reason"],
                "action_required": record["action_required"],
                "matched_record": record
            })
            
    is_flagged = len(matched_alerts) > 0
    return {
        "flagged": is_flagged,
        "matched_count": len(matched_alerts),
        "highest_severity": "CRITICAL" if any(a["severity"] == "CRITICAL" for a in matched_alerts) else ("HIGH" if is_flagged else "NONE"),
        "alerts": matched_alerts
    }

def add_watchlist_entry(record: Dict[str, Any]) -> None:
    """Add a new watchlist record for border screening tests"""
    WATCHLIST_RECORDS.append(record)
