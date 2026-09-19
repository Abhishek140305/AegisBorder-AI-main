"""Live URL reputation checks: DNS, TLS certificate, HTTP reachability and WHOIS.

Uses only the Python standard library (socket, ssl, urllib) so no extra
dependencies are needed. Each check is best-effort and never raises.
"""
import datetime
import re
import socket
import ssl
import urllib.request

TIMEOUT = 6
USER_AGENT = "RakshakAI/1.0 (+https://github.com/Terbulator/AegisBorder-AI)"
_CERT_DATE = "%b %d %H:%M:%S %Y GMT"


def _parse_host(url):
    m = re.search(r"^(?:https?://)?([^/:?#]+)", url or "", re.IGNORECASE)
    return (m.group(1).lower().strip(".") if m else "") or None


def _dns_lookup(host):
    try:
        return socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)[0][4][0]
    except Exception:
        return None


def _http_probe(host):
    """Follow redirects and report final status + URL."""
    url = f"https://{host}/" if "://" not in (host or "") else host
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return {"reachable": True, "status_code": getattr(resp, "status", 200), "final_url": resp.geturl(), "error": None}
    except urllib.error.HTTPError as e:
        return {"reachable": True, "status_code": e.code, "final_url": getattr(e, "geturl", lambda: url)(), "error": None}
    except Exception as e:
        return {"reachable": False, "status_code": None, "final_url": None, "error": type(e).__name__}


def _tls_check(host):
    """Fetch the peer certificate and report validity + expiry."""
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, 443), timeout=TIMEOUT) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                cert = ssock.getpeercert()
        if not cert:
            return {"valid": None, "issuer": None, "san": None, "expires_in_days": None, "not_valid_after": None, "error": "No certificate details returned"}
        def _cn(subject):
            for row in subject:
                if row[0][0] == "commonName":
                    return row[0][1]
            return None
        not_after = cert.get("notAfter")
        days = None
        if not_after:
            try:
                dt = datetime.datetime.strptime(not_after, _CERT_DATE)
                days = (dt - datetime.datetime.utcnow()).days
            except ValueError:
                days = None
        san = [entry[1] for entry in cert.get("subjectAltName", [])]
        return {
            "valid": days is not None and days >= 0,
            "issuer": _cn(cert.get("issuer", [])),
            "san": san[:8],
            "expires_in_days": days,
            "not_valid_after": not_after,
            "error": None,
        }
    except Exception as e:
        return {"valid": False, "issuer": None, "san": None, "expires_in_days": None, "not_valid_after": None, "error": type(e).__name__}


def _whois_ip(host, port, query, timeout=TIMEOUT):
    try:
        with socket.create_connection((host, port), timeout=timeout) as s:
            s.sendall((query + "\r\n").encode("ascii", "ignore"))
            data = b""
            while True:
                chunk = s.recv(4096)
                if not chunk:
                    break
                data += chunk
                if len(data) > 64 * 1024:
                    break
        return data.decode("utf-8", "replace")
    except Exception:
        return None


def _whois_authoritative(tld):
    """Resolve the authoritative WHOIS server for a TLD via whois.iana.org."""
    known = {
        "com": "whois.verisign-grs.com", "net": "whois.verisign-grs.com",
        "org": "whois.publicinterestregistry.org", "info": "whois.afilias.net",
        "biz": "whois.neulevel.biz", "in": "whois.registry.in",
    }
    if tld in known:
        return known[tld]
    ref = _whois_ip("whois.iana.org", 43, tld)
    m = re.search(r"^refer:\s*(\S+)", ref or "", re.MULTILINE | re.IGNORECASE)
    return m.group(1) if m else None


def _whois_parse(raw):
    if not raw or not raw.strip():
        return None
    keys = ("registrar", "creation date", "registered on", "registry expiry date", "expiration date", "updated date")
    pairs = {}
    for line in raw.splitlines():
        if ":" in line:
            key, _, val = line.partition(":")
            k = key.strip().lower()
            if k in keys:
                pairs.setdefault(k, val.strip())
    return {
        "registrar": pairs.get("registrar"),
        "created": pairs.get("creation date") or pairs.get("registered on"),
        "expires": pairs.get("registry expiry date") or pairs.get("expiration date"),
        "updated": pairs.get("updated date"),
        "server": None,
    } or None


def check_url_reputation(url):
    host = _parse_host(url)
    if not host:
        return {"domain": None, "error": "Could not parse a hostname", "dns": None, "http": None, "tls": None, "whois": None}
    ip = _dns_lookup(host)
    tls = _tls_check(host)
    http = _http_probe(host)
    tld = host.rsplit(".", 1)[-1].lower()
    whois_server = _whois_authoritative(tld)
    raw = _whois_ip(whois_server, 43, host) if whois_server else None
    whois = _whois_parse(raw)
    if whois:
        whois["server"] = whois_server
    return {
        "domain": host,
        "ip": ip,
        "dns": {"resolves": bool(ip)},
        "http": http,
        "tls": tls,
        "whois": whois if whois else None,
        "note": "On-device engine + live network reputation. WHOIS is best-effort and may be unavailable for some TLDs.",
        "error": None,
    }


if __name__ == "__main__":
    import json
    for u in ("https://onlinesbi.sbi.co.in/home.htm", "http://sbi-bank-kyc-update.top/"):
        print(json.dumps(check_url_reputation(u), indent=2, default=str))