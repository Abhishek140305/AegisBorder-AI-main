from typing import Dict, Any, List

def calculate_risk_score(
    mrz_data: Dict[str, Any],
    validation_data: Dict[str, Any],
    forensics_data: Dict[str, Any],
    biometrics_data: Dict[str, Any],
    watchlist_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Unified Border Checkpoint Risk Assessment Engine.
    Computes weighted 0-100 composite risk score & recommended officer action.
    """
    risk_factors: List[Dict[str, Any]] = []
    
    # 1. Watchlist Impact (Max 100 on critical hit)
    watchlist_risk = 0.0
    if watchlist_data.get("flagged", False):
        highest_sev = watchlist_data.get("highest_severity", "HIGH")
        watchlist_risk = 100.0 if highest_sev == "CRITICAL" else 75.0
        for alert in watchlist_data.get("alerts", []):
            risk_factors.append({
                "module": "Border Watchlist / Interpol",
                "severity": alert.get("severity", "CRITICAL"),
                "description": f"{alert.get('alert_type')}: {alert.get('reason')}",
                "impact": "+40 Risk Points"
            })

    # 2. Forensic Tampering Impact (0 - 100)
    ela_score = forensics_data.get("ela_score", 0.0)
    photo_tamper_score = forensics_data.get("photo_tamper_score", 0.0)
    noise_score = forensics_data.get("noise_discrepancy_score", 0.0)
    meta_score = forensics_data.get("metadata_tamper_score", 0.0)
    
    # Sub-threshold values represent natural compression noise
    adj_ela = max(0.0, (ela_score - 30.0) * 1.4) if ela_score > 30 else 0.0
    adj_photo = max(0.0, (photo_tamper_score - 40.0) * 1.6) if photo_tamper_score > 40 else 0.0
    adj_noise = max(0.0, (noise_score - 35.0) * 1.5) if noise_score > 35 else 0.0
    
    forensic_risk = (adj_ela * 0.40) + (adj_photo * 0.40) + (adj_noise * 0.10) + (meta_score * 0.10)
    forensic_risk = min(100.0, forensic_risk)
    
    if ela_score > 45:
        risk_factors.append({
            "module": "Forensics: ELA Analysis",
            "severity": "HIGH" if ela_score > 70 else "MEDIUM",
            "description": f"Compression anomaly detected (ELA Anomaly Score: {ela_score:.1f}%)",
            "impact": "+25 Risk Points"
        })
    if photo_tamper_score > 55:
        risk_factors.append({
            "module": "Forensics: Photo Replacement",
            "severity": "CRITICAL",
            "description": f"Portrait boundary discontinuity and color gradient jump ({photo_tamper_score:.1f}%)",
            "impact": "+35 Risk Points"
        })
    if meta_score > 50:
        detected_app = forensics_data.get("detected_software", "Digital Editor")
        risk_factors.append({
            "module": "Forensics: Digital Metadata",
            "severity": "HIGH",
            "description": f"Editing software signature detected ({detected_app})",
            "impact": "+20 Risk Points"
        })

    # 3. Document Integrity & MRZ Checksums Impact
    integrity_risk = 0.0
    if not validation_data.get("is_valid", True):
        for disc in validation_data.get("discrepancies", []):
            sev = disc.get("severity", "HIGH")
            pts = 30.0 if sev == "CRITICAL" else 15.0
            integrity_risk += pts
            risk_factors.append({
                "module": "Document Integrity & MRZ",
                "severity": sev,
                "description": disc.get("description"),
                "impact": f"+{pts:.0f} Risk Points"
            })
    integrity_risk = min(100.0, integrity_risk)

    # 4. Biometric Face Verification Impact
    biometric_risk = 0.0
    biometric_available = biometrics_data.get("biometric_available", True)
    
    if biometric_available:
        match_score = biometrics_data.get("match_score", 0.0)
        is_live = biometrics_data.get("liveness", {}).get("is_live", False)
        
        if match_score < 65.0:
            biometric_risk += (65.0 - match_score) * 2.0
            risk_factors.append({
                "module": "Biometrics: Face Verification",
                "severity": "CRITICAL" if match_score < 40 else "HIGH",
                "description": f"Face match confidence low ({match_score:.1f}% similarity)",
                "impact": "+30 Risk Points"
            })
        if not is_live:
            biometric_risk += 40.0
            risk_factors.append({
                "module": "Biometrics: Anti-Spoofing",
                "severity": "CRITICAL",
                "description": "Presentation attack detected (Potential screen replay or printed mask)",
                "impact": "+30 Risk Points"
            })
        biometric_risk = min(100.0, biometric_risk)
    else:
        # No live capture — biometrics not available, treat as neutral (no contribution)
        biometric_risk = 0.0

    # Composite Calculation:
    # If Watchlist critical hit -> override to minimum 95
    # If Document expired -> minimum 75
    composite = (integrity_risk * 0.25) + (forensic_risk * 0.35) + (biometric_risk * 0.20) + (watchlist_risk * 0.20)
    
    if watchlist_data.get("flagged", False):
        composite = max(composite, 92.0 if watchlist_data.get("highest_severity") == "CRITICAL" else 75.0)
    if validation_data.get("is_expired", False):
        composite = max(composite, 72.0)
    if photo_tamper_score > 75:
        composite = max(composite, 85.0)
    if any(d.get("severity") == "CRITICAL" for d in validation_data.get("discrepancies", [])):
        composite = max(composite, 62.0)
    elif any(d.get("severity") == "HIGH" for d in validation_data.get("discrepancies", [])):
        composite = max(composite, 48.0)

    final_score = float(round(min(100.0, max(2.0, composite)), 1))
    
    # Decision Matrix
    if final_score < 25.0:
        risk_tier = "LOW"
        decision = "GRANT ENTRY"
        color_code = "emerald"
        action_summary = "All biometric, cryptographic, and forensic checks passed. Document authentic."
    elif final_score < 55.0:
        risk_tier = "MODERATE"
        decision = "SECONDARY INSPECTION"
        color_code = "amber"
        action_summary = "Minor inconsistencies or image compression anomalies detected. Officer manual interview required."
    elif final_score < 80.0:
        risk_tier = "HIGH"
        decision = "REFUSE ENTRY & ESCORT"
        color_code = "orange"
        action_summary = "High probability of document forgery or identity mismatch. Refuse clearance and conduct formal interrogation."
    else:
        risk_tier = "CRITICAL"
        decision = "DETAIN & CONFISCATE"
        color_code = "rose"
        action_summary = "Confirmed counterfeit document, active Interpol notice, or biometric impersonation attempt. Immediate detention mandated."

    return {
        "overall_risk_score": final_score,
        "risk_tier": risk_tier,
        "recommended_decision": decision,
        "color_code": color_code,
        "action_summary": action_summary,
        "component_scores": {
            "integrity_risk": round(integrity_risk, 1),
            "forensic_tamper_risk": round(forensic_risk, 1),
            "biometric_mismatch_risk": round(biometric_risk, 1),
            "watchlist_risk": round(watchlist_risk, 1)
        },
        "risk_factors": risk_factors
    }
