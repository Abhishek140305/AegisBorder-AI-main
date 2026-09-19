import { useState } from 'react';
import { Globe, ScanLine, Loader2, Trash2, Cloud } from 'lucide-react';
import { inspectUrl } from '../../cyber/engine/urlDetector';
import { apiUrlReputation } from '../../lib/api';
import { addThreatToHistory, riskTierFromScore } from '../../lib/store';
import { announceThreat } from '../../lib/voiceAlert';
import { Badge } from '../ui';
import { OperationShell, OperationResultCard, OperationInput, uniq } from './OperationShared';
import ThreatReport from './ThreatReport';

const STATUS_LABEL = {
  SAFE: 'Verified official domain',
  SUSPICIOUS: 'Unverified domain — proceed with caution',
  CRITICAL_DANGER: 'High-risk phishing detected',
};

const EXAMPLES = ['sbi-bank-kyc-update.top', 'onlinesbi.sbi.co.in', 'paytm-cashback-offer99.buzz'];

export default function WebsiteOp({ onBack, healthState }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [display, setDisplay] = useState(null);
  const [result, setResult] = useState(null);
  const [live, setLive] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const run = async (value = url) => {
    const target = value.trim();
    if (!target || /\s/.test(target)) {
      setError('Enter a single website URL or domain (no spaces).');
      setDisplay(null); setResult(null); return;
    }
    setError(null); setDisplay(null); setResult(null); setLive(null); setLiveError(null); setSavedId(null);
    setScanning(true);

    const res = inspectUrl(target, 'en');
    if (!res) { setScanning(false); setError('Could not read that link. Check the URL and try again.'); return; }

    let liveData = null;
    if (healthState?.state === 'online') {
      try {
        liveData = await apiUrlReputation(target);
      } catch {
        setLiveError('Live reputation check unavailable — on-device result shown.');
      }
    } else {
      setLiveError('Backend offline — on-device result only.');
    }
    setLive(liveData);

    const score = res.riskScore ?? 0;
    const liveEvidence = [];
    if (liveData) {
      if (liveData.dns?.resolves) liveEvidence.push(`DNS resolves to ${liveData.ip || 'an address'}.`);
      else liveEvidence.push('Domain did not resolve during the live check.');
      if (liveData.tls) {
        if (liveData.tls.valid) liveEvidence.push(`Valid TLS certificate (${liveData.tls.issuer || 'issuer'}), expires in ~${liveData.tls.expires_in_days ?? '?'} days.`);
        else liveEvidence.push(`Live TLS handshake ${liveData.tls.error || 'failed'} — no valid certificate presented.`);
      }
      if (liveData.http?.reachable) liveEvidence.push(`Live HTTP probe returned ${liveData.http.status_code}.`);
      else if (liveData.http) liveEvidence.push(`Live HTTP probe failed (${liveData.http.error || 'unreachable'}).`);
      if (liveData.whois?.created) liveEvidence.push(`Registered ${liveData.whois.created} · expires ${liveData.whois.expires || 'unknown'}${liveData.whois.registrar ? ` · ${liveData.whois.registrar}` : ''}.`);
    }
    const evidence = [
      res.explanation?.en || null,
      res.institution ? `Matched verified institution: ${res.institution}` : null,
      res.spoofedTarget ? `Spoofing target: ${res.spoofedTarget}` : null,
      res.officialDomain ? `Official domain: ${res.officialDomain}` : null,
      res.isApkDownload ? 'Link points directly at an .apk (Android package) download.' : null,
      ...liveEvidence,
    ].filter(Boolean);

    setResult(res);
    const display = {
      score,
      tier: riskTierFromScore(score),
      statusText: STATUS_LABEL[res.status] || res.status,
      classification: res.spoofedTarget ? `Phishing — mimics ${res.spoofedTarget}` : (res.institution || (res.isThreat ? 'Suspicious link' : 'Verified / unlisted')),
      confidence: null,
      indicators: uniq([...(res.reasons || [])]),
      evidence,
      recommendation: res.isThreat
        ? `Do not visit this link. If contacted via message or call, report to 1930 (National Cyber Helpline).
        ${res.officialHelpline && !res.officialHelpline.startsWith('1930') ? `For ${res.spoofedTarget || 'the mimicked institution'}: ${res.officialHelpline}.` : ''}`
        : (res.institution ? 'Link matches a verified official domain. Always verify the URL bar before entering credentials.'
          : `On-device blacklist returned no match. ${liveData ? 'The live check found the site reachable with a valid TLS certificate, but treat it with caution and verify before entering credentials.' : 'Live reputation could not be fetched — treat as unverified.'}`),
      note: 'Analysis combines the on-device engine (spelling, typosquatting, homograph, risky-TLD and blacklist) with a live backend reputation probe (DNS, TLS certificate, HTTP reachability and WHOIS when available).',
    };
    setDisplay(display);
    announceThreat(display);
    const rec = addThreatToHistory('website', { ...res, _live: liveData }, {
      target,
      classification: res.spoofedTarget ? `Phishing — mimics ${res.spoofedTarget}` : (res.institution || (res.isThreat ? 'Suspicious link' : 'Website check')),
      indicators: res.reasons || [],
      evidence,
      recommendation: res.isThreat ? 'Do not visit this link. Report to 1930.' : 'Site unlisted on-device; treat as unverified unless the live check confirms it.',
      safe: res.status === 'SAFE' || !res.isThreat,
    });
    setSavedId(rec.id);
    setScanning(false);
  };

  return (
    <OperationShell
      icon={<Globe className="h-5 w-5" aria-hidden="true" />}
      title="Website Checker"
      subtitle="Check an unknown link against typosquatting and blacklist engines, then verify it live on the network (SSL, redirects, WHOIS)."
      inputs="Domain • URL"
      onBack={onBack}
    >
      <div className="space-y-4">
        <OperationInput
          label="Website link or domain"
          hint="e.g. onlinesbi.sbi.co.in"
          error={error}
          value={url}
          placeholder="Paste the link you want to check…"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
        />

        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <Cloud className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="text-[11.5px] text-slate-500">
            {healthState?.state === 'online'
              ? 'Live reputation enabled — DNS, TLS certificate, HTTP reachability and WHOIS are checked on the server.'
              : 'Backend offline — this scan will use the on-device engine only (no live SSL/WHOIS check).'}
          </p>
        </div>

        <p className="text-xs font-semibold text-slate-500">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => run(ex)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-700 transition-colors hover:border-navy-300 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
            >
              {ex}
            </button>
          ))}
        </div>

        {liveError && <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{liveError}</div>}

        {live && !scanning && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Badge color={live.dns?.resolves ? 'green' : 'red'}>DNS {live.dns?.resolves ? 'resolves' : 'failed'}</Badge>
            {live.tls && <Badge color={live.tls.valid ? 'green' : 'red'}>TLS {live.tls.valid ? 'valid' : 'invalid'}</Badge>}
            {live.http?.reachable && <Badge color="green">HTTP {live.http.status_code}</Badge>}
            {live.whois?.created && <Badge color="slate">WHOIS {live.whois.created}</Badge>}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => { setUrl(''); setDisplay(null); setResult(null); setSavedId(null); }}
            disabled={!url} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
          <button type="button" onClick={() => run()}
            disabled={!url.trim() || scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking link…</> : <><ScanLine className="h-4 w-4" aria-hidden="true" /> Check Link</>}
          </button>
        </div>

        {scanning && <p className="text-sm text-slate-500" aria-live="polite">Checking spelling, impersonation, blacklist — then probing the live site…</p>}

        {display && !scanning && (
          <OperationResultCard
            display={display}
            savedId={savedId}
            onViewReport={() => setShowReport(true)}
            onRunNew={() => { setUrl(''); setDisplay(null); setResult(null); setSavedId(null); }}
          />
        )}
      </div>

      {showReport && savedId && result && <ThreatReport record={{ ...display, full: { ...result, _live: live }, id: savedId, ts: new Date().toISOString(), person: 'Website Checker', documentNumber: result.domain, factors: display.indicators, evidence: display.evidence, recommendation: display.recommendation, classification: display.classification, riskScore: display.score, riskTier: display.tier }} onClose={() => setShowReport(false)} />}
    </OperationShell>
  );
}