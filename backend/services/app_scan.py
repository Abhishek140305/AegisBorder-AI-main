"""APK file scan: SHA-256 fingerprint + optional VirusTotal hash lookup.

No API key required to run: the hash is always computed and matched against a
local prefix registry. If VIRUSTOTAL_API_KEY is set, the hash is additionally
looked up on VirusTotal (v3 files endpoint). The key is read from the
environment only and never logged or exposed.
"""
import hashlib
import os
import json
import urllib.request
import urllib.error

VT_API_URL = "https://www.virustotal.com/api/v3/files/{sha}"
# Tiny local hash registry (full SHA-256 prefixes) — extend with real hashes.
LOCAL_HASH_REGISTRY = {}


def _sha256(data):
    return hashlib.sha256(data).hexdigest()


def _vt_lookup(sha):
    key = os.getenv("VIRUSTOTAL_API_KEY")
    if not key:
        return {"queried": False, "reason": "VIRUSTOTAL_API_KEY not configured"}
    try:
        req = urllib.request.Request(
            VT_API_URL.format(sha=sha),
            headers={"x-apikey": key, "User-Agent": "RakshakAI/1.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode("utf-8", "replace"))
        stats = (body.get("data") or {}).get("attributes", {}).get("last_analysis_stats", {})
        return {
            "queried": True,
            "found": True,
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
            "undetected": stats.get("undetected", 0),
            "total": sum(stats.values()) or None,
        }
    except urllib.error.HTTPError as e:
        found = e.code == 404
        return {"queried": True, "found": found, "malicious": 0, "suspicious": 0, "undetected": 0, "total": None,
                "error": "Not previously scanned" if found else f"VirusTotal {e.code}"}
    except Exception as e:
        return {"queried": True, "found": None, "error": type(e).__name__}


def scan_apk_file(name, data):
    sha = _sha256(data)
    local = LOCAL_HASH_REGISTRY.get(sha)
    return {
        "name": name,
        "size_bytes": len(data),
        "sha256": sha,
        "local_match": bool(local),
        "local_entry": local,
        "virus_total": _vt_lookup(sha),
        "note": "On-device signature analysis (permissions & known package names) is performed in your browser. "
                "This endpoint fingerprints the uploaded file with SHA-256 and, when a VirusTotal API key is "
                "configured on the server, queries the hash reputation. The file bytes are not stored.",
    }


if __name__ == "__main__":
    print(scan_apk_file("test.apk", b"mock-apk-bytes"))