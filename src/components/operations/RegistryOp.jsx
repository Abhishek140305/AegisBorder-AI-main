import { useState } from 'react';
import { Database, Search, Loader2, Trash2, Fingerprint, CreditCard, Phone, Globe as GlobeIcon } from 'lucide-react';
import knownThreats from '../../cyber/data/knownThreats.json';
import { globalBloomFilter } from '../../cyber/engine/bloomFilter';
import { addThreatToHistory, riskTierFromScore } from '../../lib/store';
import { announceThreat } from '../../lib/voiceAlert';
import { cx } from '../ui';
import { OperationShell, OperationResultCard, OperationInput } from './OperationShared';
import ThreatReport from './ThreatReport';

const TYPES = [
  { id: 'domain', label: 'Website / domain', icon: GlobeIcon },
  { id: 'vpa', label: 'UPI VPA', icon: Fingerprint },
  { id: 'phone', label: 'Phone / SIM', icon: Phone },
  { id: 'apk', label: 'APK / app', icon: CreditCard },
];

const EXAMPLES = {
  domain: 'sbi-bank-kyc-update.top',
  vpa: 'cashback-claim@ybl',
  phone: '+919876543210',
  apk: 'com.sbi.kyc.verification.doc',
};

function normalizePhone(p) {
  const digits = String(p).replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

export default function RegistryOp({ onBack }) {
  const [type, setType] = useState('domain');
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [display, setDisplay] = useState(null);
  const [result, setResult] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const run = (value = q, typ = type) => {
    const target = value.trim().toLowerCase();
    if (!target) { setError(null); setDisplay(null); setResult(null); return; }
    setError(null);
    setDisplay(null);
    setResult(null);
    setSavedId(null);
    setScanning(true);
    setTimeout(() => {
      const lookups = [];
      let hit = null;
      let bloomMatch = false;
      let bloomMs = ['domain', 'vpa', 'phone'].includes(typ) ? globalBloomFilter.contains(typ === 'phone' ? normalizePhone(target) : target).lookupTimeMs : null;

      const check = (needle, source, kind) => {
        const res = globalBloomFilter.contains(needle);
        bloomMs = res.lookupTimeMs;
        lookups.push(res.match);
        bloomMatch = bloomMatch || res.match;
        if (res.match && !hit) hit = { kind, needle, source, sourceType: 'Bloom filter (blacklist)' };
      };

      if (typ === 'domain') {
        knownThreats.domains.forEach((d) => { if (d === target) hit = hit || { kind: 'domain', needle: d, source: d, sourceType: 'On-device blacklist' }; });
        knownThreats.apkSignatures.forEach((a) => a.packageName === target && (hit = hit || { kind: 'domain', needle: target, source: a, sourceType: 'APK signature' }));
        check(target, null, 'domain');
      } else if (typ === 'vpa') {
        knownThreats.vpas.forEach((v) => { if (v === target) hit = hit || { kind: 'vpa', needle: v, source: v, sourceType: 'On-device blacklist' }; });
        check(target, null, 'vpa');
      } else if (typ === 'phone') {
        const p = normalizePhone(target);
        knownThreats.phoneNumbers.forEach((n) => { if (n === p || n.replace(/\D/g, '') === p.replace(/\D/g, '')) hit = hit || { kind: 'phone', needle: n, source: n, sourceType: 'On-device blacklist' }; });
        check(p, null, 'phone');
      } else if (typ === 'apk') {
        const sig = knownThreats.apkSignatures.find((s) => target.includes(s.packageName) || target.includes(s.appName.toLowerCase()));
        if (sig) hit = { kind: 'apk', needle: sig.packageName, source: sig, sourceType: 'APK signature registry' };
      }

      setScanning(false);
      setResult({ type: typ, target, lookups, bloomMs, hit });
      const hitScore = hit?.kind === 'apk' ? (hit.source.riskScore ?? 99) : 99;
      if (hit) {
        const indicators = [`Listed in ${hit.sourceType}`];
        const evidence = [
          `Matched identifier: ${hit.needle}`,
          hit.kind === 'apk' ? `App: ${hit.source.appName} — risk ${hit.source.riskScore}/100` : null,
          hit.kind === 'apk' ? `Requested permissions: ${hit.source.dangerousPermissions.join(', ')}` : null,
          typ !== 'apk' ? `Bloom filter ${bloomMatch ? 'match' : 'no direct match'} in ${bloomMs}ms across ${lookups.length} lookup(s).` : null,
        ].filter(Boolean);
        const classification = hit.kind === 'apk' ? `Malware signature — ${hit.source.appName}` : 'Flagged — listed in registry';
        const recommendation = 'Do not interact with this identifier. Report to 1930 (National Cyber Helpline) and block the sender/source.';
        const display = {
          score: hitScore,
          tier: riskTierFromScore(hitScore),
          statusText: 'Match found in on-device registry',
          classification,
          confidence: null,
          indicators,
          evidence,
          recommendation,
          note: 'The registry covers known fraud domains, VPAs, phone numbers and APK signatures. A hit does not prove identity of the person behind it; the bloom filter may also yield rare false positives.',
        };
        setDisplay(display);
        announceThreat(display);
        const rec = addThreatToHistory('scam-registry', { riskScore: hitScore, isThreat: true, category: 'Registry match' }, {
          target: hit.needle,
          classification,
          indicators,
          evidence,
          recommendation,
          safe: false,
        });
        setSavedId(rec.id);
      } else {
        setDisplay({
          score: 0,
          tier: 'LOW',
          statusText: 'Not found in the on-device registry',
          classification: 'No registry match',
          confidence: null,
          indicators: [],
          evidence: [
            typ === 'apk' ? 'Compared against the on-device APK signature registry.' : `Searched ${lookups.length} lookup(s) across the on-device blacklist in ${bloomMs}ms.`,
            typ === 'phone' ? `Normalized query: ${normalizePhone(target)}` : `Query: ${target}`,
          ],
          recommendation: 'No match recorded — but absence from this registry does NOT guarantee safety.',
          note: 'Search completed against the on-device blacklist (contains registered fraud domains, VPAs, phone numbers and APK signatures). The registry is not a live national database and may be incomplete.',
        });
      }
    }, 900);
  };

  return (
    <OperationShell
      icon={<Database className="h-5 w-5" aria-hidden="true" />}
      title="Scam Registry"
      subtitle="Search phone numbers, website domains, UPI addresses and APK signatures against the on-device fraud registry."
      inputs="Phone • Domain • VPA • APK"
      onBack={onBack}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-full sm:w-fit">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setType(t.id); setQ(''); setDisplay(null); setResult(null); }}
                className={cx('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700', active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900')}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {t.label}
              </button>
            );
          })}
        </div>

        <OperationInput
          label={type === 'phone' ? 'Phone number' : type === 'domain' ? 'Website / domain' : type === 'vpa' ? 'UPI virtual payment address' : 'APK / package name'}
          hint={type === 'phone' ? 'e.g. +91 98765 43210' : type === 'domain' ? 'e.g. sbi-bank-kyc-update.top' : type === 'vpa' ? 'e.g. name@bank' : 'e.g. com.support.anydesk.quickfix'}
          error={error}
          value={q}
          placeholder="Enter the identifier to search…"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
        />

        <p className="text-xs font-semibold text-slate-500">Try an example</p>
        <button
          type="button"
          onClick={() => { setQ(EXAMPLES[type]); run(EXAMPLES[type], type); }}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-700 transition-colors hover:border-navy-300 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
        >
          {EXAMPLES[type]}
        </button>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => { setQ(''); setDisplay(null); setResult(null); setSavedId(null); }}
            disabled={!q} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
          <button type="button" onClick={() => run()}
            disabled={!q.trim() || scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching registry…</> : <><Search className="h-4 w-4" aria-hidden="true" /> Search Registry</>}
          </button>
        </div>

        {scanning && <p className="text-sm text-slate-500" aria-live="polite">Querying the on-device blacklist and bloom filter…</p>}

        {display && !scanning && (
          <OperationResultCard
            display={display}
            savedId={savedId}
            onViewReport={() => setShowReport(true)}
            onRunNew={() => { setQ(''); setDisplay(null); setResult(null); setSavedId(null); }}
          />
        )}
      </div>

      {showReport && savedId && result && <ThreatReport record={{ ...display, full: result, id: savedId, ts: new Date().toISOString(), person: 'Scam Registry', documentNumber: result.target, factors: display.indicators, evidence: display.evidence, recommendation: display.recommendation, classification: display.classification, riskScore: display.score, riskTier: display.tier }} onClose={() => setShowReport(false)} />}
    </OperationShell>
  );
}