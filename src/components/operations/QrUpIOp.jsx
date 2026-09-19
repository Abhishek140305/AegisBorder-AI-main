import { useState } from 'react';
import { QrCode, Loader2, Trash2, Wallet, ImageUp } from 'lucide-react';
import { parseUpiPayload } from '../../cyber/engine/upiQrDetector';
import { apiDecodeQr } from '../../lib/api';
import { addThreatToHistory, riskTierFromScore } from '../../lib/store';
import { announceThreat } from '../../lib/voiceAlert';
import { OperationShell, OperationResultCard, OperationInput } from './OperationShared';
import ThreatReport from './ThreatReport';

const EXAMPLES = [
  'upi://pay?pa=cashback-claim@ybl&pn=Refund%20Claim&am=2500&cu=INR&tn=Claim%20your%20cashback',
  'upi://pay?pa=friend91@okhdfcbank&pn=Neha%20Sharma&am=500&cu=INR',
  'upi://pay?pa=cashback-reward@axl&pn=Reward%20Center&am=8999&cu=INR&tn=Lottery%20winner%20processing',
];

export default function QrUpIOp({ onBack, healthState }) {
  const [payload, setPayload] = useState('');
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [display, setDisplay] = useState(null);
  const [result, setResult] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const decodeFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (healthState?.state !== 'online') {
      setError('Backend offline — image QR decoding needs the server. Paste the decoded UPI link instead.');
      return;
    }
    setError(null);
    setDecoding(true);
    setFileName(file.name);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const parsed = await apiDecodeQr(dataUrl, file.name);
      if (!parsed.payload) {
        setError(parsed.message || 'No QR code detected in that image.');
        setDecoding(false);
        return;
      }
      setPayload(parsed.payload);
      setDecoding(false);
      run(parsed.payload);
    } catch (err) {
      setDecoding(false);
      setError(err.message || 'Could not decode that QR image.');
    }
    e.target.value = '';
  };

  const run = (value = payload) => {
    const target = value.trim();
    if (!target) { setError(null); setDisplay(null); return; }
    if (!/^upi:\/\/pay/i.test(target) && !(target.includes('@') && /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(target))) {
      setError('Enter a UPI payment link (upi://pay?pa=…&pn=…&am=…) or a virtual payment address (name@bank).');
      setDisplay(null);
      setResult(null);
      return;
    }
    setError(null);
    setDisplay(null);
    setResult(null);
    setSavedId(null);
    setScanning(true);
    setTimeout(() => {
      const res = parseUpiPayload(target);
      setScanning(false);
      if (!res) { setError('Could not read that UPI payload. Check it and try again.'); return; }
      const score = res.riskScore ?? 0;
      const evidence = [
        `Recipient VPA: ${res.vpa || '—'}`,
        `Payee: ${res.payeeName}`,
        res.amount != null ? `Amount: ${res.currency || 'INR'} ${res.amount}` : null,
        res.transactionNote ? `Note: ${res.transactionNote}` : null,
        ...(res.riskReasons || []),
      ].filter(Boolean);
      const display = {
        score,
        tier: riskTierFromScore(score),
        statusText: res.isThreat ? 'Deceptive / flagged payment link' : 'No deceptive indicators on this payment link',
        classification: res.hasDeceptiveIntent ? 'Payment Fraud — cashback/refund lure' : (res.isThreat ? 'Flagged payment link' : 'Payment link'),
        confidence: null,
        indicators: res.riskReasons || [],
        evidence,
        recommendation: res.isThreat
          ? `Do not scan or pay. ${res.frictionMessage?.en || ''} Report the link to 1930 (National Cyber Helpline).`
          : 'This payment link shows no deception indicators. Always verify the beneficiary name before entering your UPI PIN.',
        note: fileName
          ? `QR decoded from uploaded image (${fileName}) on the server, then inspected on-device.`
          : 'Pasted deep-link analysis. You can also upload a QR image and have the server decode it.',
      };
      setResult(res);
      setDisplay(display);
      announceThreat(display);
      const rec = addThreatToHistory('qr-upi', res, {
        target: res.vpa,
        classification: res.hasDeceptiveIntent ? 'Payment Fraud — cashback/refund lure' : (res.isThreat ? 'Flagged payment link' : 'Payment link'),
        indicators: res.riskReasons || [],
        evidence,
        recommendation: res.isThreat ? res.frictionMessage?.en : 'Link shows no deception indicators.',
        safe: !res.isThreat,
      });
      setSavedId(rec.id);
    }, 900);
  };

  return (
    <OperationShell
      icon={<QrCode className="h-5 w-5" aria-hidden="true" />}
      title="QR & UPI Safety"
      subtitle="Inspect a UPI payment deep-link before you scan or pay, to catch cashback/reward lures and flagged virtual payment addresses."
      inputs="upi://pay link • VPA"
      onBack={onBack}
    >
      <div className="space-y-4">
        <OperationInput
          as="textarea"
          label="UPI deep-link or VPA"
          hint="Paste from QR or payment message"
          error={error}
          value={payload}
          rows={3}
          placeholder="upi://pay?pa=name@bank&pn=Merchant&am=100&cu=INR"
          onChange={(e) => setPayload(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-navy-300 hover:bg-navy-50 ${decoding ? 'opacity-60' : ''}`}>
            {decoding ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Decoding QR image…</> : <><ImageUp className="h-4 w-4" aria-hidden="true" /> {fileName ? `Re-upload QR (${fileName})` : 'Upload QR image'}</>}
            <input type="file" accept="image/*" className="sr-only" onChange={decodeFile} disabled={decoding} />
          </label>
          {healthState?.state !== 'online' && (
            <span className="text-[11px] text-amber-700">Backend offline — image decoding unavailable; paste the link instead.</span>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-500">Try an example</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setPayload(ex); run(ex); }}
              className="truncate rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-[10.5px] text-slate-700 text-left transition-colors hover:border-navy-300 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => { setPayload(''); setDisplay(null); setResult(null); setSavedId(null); }}
            disabled={!payload} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
          <button type="button" onClick={() => run()}
            disabled={!payload.trim() || scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Inspecting payload…</> : <><Wallet className="h-4 w-4" aria-hidden="true" /> Inspect Payment Link</>}
          </button>
        </div>

        {scanning && <p className="text-sm text-slate-500" aria-live="polite">Decoding the UPI payload and checking the payee against the offline registry…</p>}

        {display && !scanning && (
          <OperationResultCard
            display={display}
            savedId={savedId}
            onViewReport={() => setShowReport(true)}
            onRunNew={() => { setPayload(''); setDisplay(null); setResult(null); setSavedId(null); }}
          />
        )}
      </div>

      {showReport && savedId && result && <ThreatReport record={{ ...display, full: result, id: savedId, ts: new Date().toISOString(), person: 'QR & UPI Safety', documentNumber: result.vpa, factors: display.indicators, evidence: display.evidence, recommendation: display.recommendation, classification: display.classification, riskScore: display.score, riskTier: display.tier }} onClose={() => setShowReport(false)} />}
    </OperationShell>
  );
}