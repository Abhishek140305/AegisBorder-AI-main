"""AI threat analysis: conversation/email/document categorization.

Primary path: OpenAI chat completion (model + key via env) producing a
structured JSON verdict. If OPENAI_API_KEY is not set (or the call fails),
falls back to a deterministic on-server heuristic analyzer so the endpoint
remains functional without external credentials. The result always declares
which provider produced it.
"""
import json
import os
import re
import urllib.request
import urllib.error

# (regex, category, severity, keywords, recommendation)
_PATTERNS = [
    (r"disconnect|connection.*(cut|sever)|cut.*(off|jayega)|bijli|electricity", "Consent-Trap Utility Threat", 88,
     ("disconnect", "connection cut", "bijli", "electricity", "raat 9 baje"),
     "Do not pay over the phone or via a UPI link. Verify the disconnection notice with the utility's official helpline."),
    (r"kyc.*(expire|block|update|pending|reactivate)|netbanking.*(block|suspend)|account.*(suspend|block)", "Banking Impersonation", 90,
     ("kyc update", "netbanking will be blocked", "account blocked", "re-activate"),
     "Banks never block accounts without notice or ask for KYC by link. Contact your bank on its official number."),
    (r"lottery|winner|prize|claim.*(reward|cashback)|cashback.*(claim|pay)|reward.*(emp|point)|refund.*(dept|claim)", "Prize / Cashback Lure", 84,
     ("lottery", "winner", "prize", "cashback", "reward", "refund claim"),
     "You cannot win money you never entered. Never pay a fee or share OTP to claim a reward."),
    (r"anydesk|teamviewer|quick ?support|remote support|screen ?share|download .*support ?app", "Tech-Support / Screen-Sharing Scam", 92,
     ("anydesk", "teamviewer", "remote support", "screen share"),
     "A bank or police officer will never ask you to install screen-sharing software. End the call and report to 1930."),
    (r"job.*(offer|salary|registration)|part ?time.*(earn|income)|work from home", "Fake Job / Income Offer", 72,
     ("job offer", "part time", "earn", "work from home"),
     "Do not pay a registration fee, advance or 'processing charge' for a job that contacted you unsolicited."),
    (r"upi|gpay|phonepe|paytm|vpa|@ybl|@ibl|@axl", "Payment-Link Pressure", 78,
     ("upi", "gpay", "phonepe", "paytm", "vpa"),
     "Scrutinise every UPI request. A UPI PIN is for sending, never receiving — refuse and report to 1930."),
    (r"aadhaar|pan.*(link|update)|otp.*(share|confirm progress)|share.*(otp|pin|password)", "Credential / OTP Harvesting", 86,
     ("aadhaar", "pan card", "share otp", "confirm otp"),
     "Never share OTP, PIN or full document images. Government services never ask for remote 'help'."),
]

_SAFE_RECO = "No high-confidence scam patterns matched. Treat unsolicited messages with caution regardless."


def _heuristic(content):
    text = (content or "").lower()
    best = None
    for pattern, category, severity, keywords, recommendation in _PATTERNS:
        if re.search(pattern, text):
            hit_keywords = [k for k in keywords if k in text]
            if best is None or severity > best["risk_score"]:
                best = {
                    "category": category,
                    "risk_score": severity,
                    "is_threat": True,
                    "indicators": [f"Pattern: {k}" for k in hit_keywords] or [category],
                    "recommendation": recommendation,
                    "summary": f"Matched {category} indicators from {len(hit_keywords)} keyword sign(s).",
                }
    if best is None:
        return {
            "category": "No threat detected",
            "risk_score": 5,
            "is_threat": False,
            "indicators": [],
            "recommendation": _SAFE_RECO,
            "summary": "No high-confidence scam patterns were matched in the provided text.",
        }
    return best


def _openai(content):
    key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if not key:
        return None
    sys_prompt = (
        "You are Rakshak AI's threat analyst. Classify the user-supplied message or document "
        "text for scams, phishing, social engineering or payment fraud in India. "
        'Reply with ONLY a JSON object: {"category": string, "risk_score": 0-100, '
        '"is_threat": boolean, "indicators": [string], "recommendation": string, "summary": string}.'
    )
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": content[:12000]},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 600,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        text = body["choices"][0]["message"]["content"]
        data = json.loads(text)
        data.setdefault("category", "Unclassified")
        data.setdefault("risk_score", 0)
        data.setdefault("is_threat", False)
        data.setdefault("indicators", [])
        data.setdefault("recommendation", _SAFE_RECO)
        data.setdefault("summary", "Reviewed by the remote analyst model.")
        return data
    except (urllib.error.HTTPError, urllib.error.URLError, KeyError, TypeError, json.JSONDecodeError) as e:
        return {"_error": type(e).__name__}


def analyze_threat(content, title=None):
    text = (content or "").strip()
    if not text:
        return {"provider": "local-heuristic", "category": "No input", "risk_score": 0, "is_threat": False,
                "indicators": [], "recommendation": "Provide text to analyze.", "summary": "Empty input."}
    oa = _openai(text)
    if oa and "_error" not in oa:
        oa["provider"] = "openai"
        oa["model"] = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return oa
    verdict = _heuristic(text)
    verdict["provider"] = "local-heuristic"
    verdict["model"] = "on-server rule patterns"
    verdict["title"] = title
    if oa:
        verdict["note"] = f"Remote analyst unavailable ({oa['_error']}); used the on-server analyzer."
    return verdict


if __name__ == "__main__":
    import json
    sample = "Dear customer your prepaid electricity meter will be disconnected tonight by 9. Please pay ₹200 immediately via this link."
    print(json.dumps(analyze_threat(sample), indent=2, default=str))