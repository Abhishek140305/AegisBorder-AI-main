import { useState } from 'react';
import { Smartphone, ShieldAlert, Loader2, Trash2, UploadCloud, FileArchive } from 'lucide-react';
import { inspectApk } from '../../cyber/engine/apkInspector';
import { apiScanApp } from '../../lib/api';
import { addThreatToHistory, riskTierFromScore } from '../../lib/store';
import { announceThreat } from '../../lib/voiceAlert';
import { globalBloomFilter } from '../../cyber/engine/bloomFilter';
import { parseUrl } from '../../cyber/engine/urlDetector';
import { Badge } from '../ui';
import { OperationShell, OperationResultCard, OperationInput } from './OperationShared';
import ThreatReport from './ThreatReport';

const EXAMPLES = ['com.support.anydesk.quickfix', 'com.bijli.bill.update.official', 'com.whatsapp'];

const PERM_TONE = { CRITICAL: 'red', HIGH: 'orange', MEDIUM: 'amber', LOW: 'slate' };
const SIZE_LIMIT = 200 * 1024 * 1024;

export default function AppOp({ onBack, healthState }) {
  const [appId, setAppId] = useState('');
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [fileMeta, setFileMeta] = useState(null);
  const [display, setDisplay] = useState(null);
  const [result, setResult] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const scanFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > SIZE_LIMIT) {
      setError('File too large (max 200 MB).');
      e.target.value = '';
      return;
    }
    if (healthState?.state !== 'online') {
      setError('Backend offline — file fingerprinting needs the server. Enter the package name or .apk link instead.');
      e.target.value = '';
      return;
    }
    setError(null);
    setScanning(true);
    setFileMeta(null);
    try {
      const meta = await apiScanApp(file.name, file);
      setFileMeta(meta);
      setScanning(false);
      run(file.name, meta);
    } catch (err) {
      setScanning(false);
      setError(err.message || 'Could not scan that file.');
    }
    e.target.value = '';
  };

  const run = (value = appId, meta = fileMeta) => {
    const target = value.trim();
    if (!target) { setError(null); setDisplay(null); setResult(null); return; }
    setError(null);
    setDisplay(null);
    setResult(null);
    setSavedId(null);
    setScanning(true);
    setTimeout(() => {
      const res = inspectApk(target);
      setScanning(false);
      if (!res) { setError('Could not identify that app. Enter a package name or an .apk link.'); return; }
      const score = res.riskScore ?? 0;
      const evidence = [
        res.warning?.en || null,
        `Package: ${res.packageName}`,
        res.isRatThreat ? 'Combines Accessibility service + SMS/OTP read access — classic Remote Access Trojan signature.' : null,
        res.permissionCount ? `${res.permissionCount} dangerous permission request(s) requested.` : 'No known-dangerous permission requested.',
        meta?.sha256 ? `Uploaded file SHA-256: ${meta.sha256}` : null,
        meta?.size_bytes != null ? `File size: ${meta.size_bytes} bytes` : null,
        meta?.local_match ? 'File hash matches a locally-listed malicious signature.' : null,
        meta?.virus_total
          ? (meta.virus_total.queried ? `VirusTotal lookup: ${meta.virus_total.detections} security vendor(s) flagged this hash.` : `VirusTotal not queried — ${meta.virus_total.reason || 'API key not configured'}.`)
          : null,
        meta?._note ? String(meta._note) : null,
        meta?.note ? String(meta.note) : null,
      ].filter(Boolean);
      const noMatch = score === 0;
      const bloom = !res.isRatThreat
        ? ([target, res.packageName, parseUrl(target).hostname].find((t) => t && globalBloomFilter.contains(t)?.match) ? { match: true } : null)
        : null;
      const indicators = res.isRatThreat
        ? ['Accessibility + OTP reading (RAT pattern)']
        : (noMatch ? ['Unknown signature'] : ['Known-malware signature match']);
      if (bloom?.match) indicators.unshift('Listed on the on-device malware blacklist (Bloom Filter)');
      const recommendation = res.isRatThreat
        ? `Do NOT install this app. ${res.warning?.en || ''} Uninstall it if already installed and review any SMS/OTP access granted.`
        : (noMatch
          ? 'This app is not in the known-malware registry, but it is unverified. Only install APKs from official app stores and review requested permissions.'
          : 'Do not install. Remove the app and run a security review of devices it was installed on.');
      const display = {
        score,
        tier: riskTierFromScore(score),
        statusText: noMatch
          ? 'No matching signature in the on-device malware registry'
          : (res.isRatThreat ? 'Remote Access Trojan (RAT) indicators detected' : 'Flagged app — high-risk permission set'),
        classification: noMatch ? 'Unverified third-party app' : (res.isRatThreat ? 'Malware — Remote Access Trojan' : 'High-risk app'),
        confidence: null,
        indicators,
        evidence,
        recommendation,
        note: meta
          ? `Fingerprint (SHA-256) computed on the server ${meta.virus_total?.queried ? 'and checked against VirusTotal' : ''}; risk evaluation is on-device. A "clean" hash is not a guarantee of safety.`
          : 'Permission-risk and on-device signature analysis only. No app binary is downloaded, executed or scanned here — absence from the registry is not a guarantee of safety.',
      };
      setResult(res);
      setDisplay(display);
      announceThreat(display);
      const rec = addThreatToHistory('app', res, {
        target: res.appName || target,
        classification: noMatch ? 'Unverified third-party app' : (res.isRatThreat ? 'Malware — Remote Access Trojan' : 'High-risk app'),
        indicators,
        evidence,
        recommendation,
        safe: !res.isRatThreat && res.permissions.length === 0,
      });
      setSavedId(rec.id);
    }, 900);
  };

  return (
    <OperationShell
      icon={<Smartphone className="h-5 w-5" aria-hidden="true" />}
      title="App Safety"
      subtitle="Check a downloaded APK or app package for known malware signatures and dangerous permission requests before installation."
      inputs="Package name • .apk link • App name"
      onBack={onBack}
    >
      <div className="space-y-4">
        <OperationInput
          label="App package name or APK link"
          hint="e.g. com.support.anydesk.quickfix"
          error={error}
          value={appId}
          placeholder="Paste the package name or .apk download link…"
          onChange={(e) => setAppId(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-navy-300 hover:bg-navy-50 ${scanning ? 'opacity-60' : ''}`}>
            {scanning && !appId.trim() ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Fingerprinting APK…</> : <><UploadCloud className="h-4 w-4" aria-hidden="true" /> Upload .apk for fingerprinting</>}
            <input type="file" accept=".apk,application/vnd.android.package-archive,application/octet-stream" className="sr-only" onChange={scanFile} disabled={scanning} />
          </label>
          {fileMeta?.sha256 && (
            <span className="truncate font-mono text-[11px] text-slate-500" title={fileMeta.sha256}>
              <FileArchive className="mr-1 inline h-3 w-3" aria-hidden="true" />
              SHA-256 {fileMeta.sha256.slice(0, 12)}…{fileMeta.sha256.slice(-8)}
            </span>
          )}
          {healthState?.state !== 'online' && (
            <span className="text-[11px] text-amber-700">Backend offline — fingerprinting unavailable; use the package-name check.</span>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-500">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => { setAppId(ex); run(ex); }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-700 transition-colors hover:border-navy-300 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => { setAppId(''); setDisplay(null); setResult(null); setSavedId(null); }}
            disabled={!appId} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
          <button type="button" onClick={() => run()}
            disabled={!appId.trim() || scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking app…</> : <><ShieldAlert className="h-4 w-4" aria-hidden="true" /> Check App</>}
          </button>
        </div>

        {scanning && <p className="text-sm text-slate-500" aria-live="polite">Reviewing requested permissions and matching against the known-malware registry…</p>}

        {display && !scanning && (
          <OperationResultCard
            display={display}
            savedId={savedId}
            onViewReport={() => setShowReport(true)}
            onRunNew={() => { setAppId(''); setDisplay(null); setResult(null); setSavedId(null); }}
          />
        )}

        {result?.permissions?.length > 0 && !scanning && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" /> Dangerous permission requests
            </p>
            <ul className="space-y-3">
              {result.permissions.map((p, i) => (
                <li key={i} className="rounded-lg border border-red-100 bg-white px-3.5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="text-[11px] font-semibold text-slate-800">{p.permission}</code>
                    <Badge color={PERM_TONE[p.severity] || 'slate'}>{p.severity}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600">{p.userExplanation?.en}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showReport && savedId && result && <ThreatReport record={{ ...display, full: result, id: savedId, ts: new Date().toISOString(), person: 'App Safety', documentNumber: `${result.appName} · ${result.packageName}`, factors: display.indicators, evidence: display.evidence, recommendation: display.recommendation, classification: display.classification, riskScore: display.score, riskTier: display.tier }} onClose={() => setShowReport(false)} />}
    </OperationShell>
  );
}