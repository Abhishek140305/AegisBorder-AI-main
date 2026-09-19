import { useState } from 'react';
import { MessageSquare, Search, Loader2, Trash2, UserX, UserCheck, Lock } from 'lucide-react';
import { analyzeMessage } from '../../cyber/engine/codeMixedNlp';
import { globalBloomFilter } from '../../cyber/engine/bloomFilter';
import { parseUrl } from '../../cyber/engine/urlDetector';
import { addThreatToHistory, riskTierFromScore } from '../../lib/store';
import { announceThreat } from '../../lib/voiceAlert';
import { OperationShell, OperationResultCard, OperationInput, uniq } from './OperationShared';
import ThreatReport from './ThreatReport';

const EXAMPLES = [
  { label: 'Fake electricity disconnection', text: 'Dear customer aapka bijli bill update nahi hai, aaj raat 9 baje connection cut jayega. Pay ₹20 immediately using this link electricity-nodal-officer.in/pay' },
  { label: 'Fake bank KYC', text: 'Dear SBI User, your YONO NetBanking will be blocked today due to pending KYC update. Click http://sbi-bank-kyc-update.top to reactivate account.' },
  { label: 'Friend photo link (saved contact)', text: 'Hey, check this photo link http://trip-photos-share.top from yesterday’s family picnic!', known: true },
];

export default function MessageOp({ onBack }) {
  const [text, setText] = useState('');
  const [known, setKnown] = useState(false);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [display, setDisplay] = useState(null);
  const [result, setResult] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const run = (value = text, isKnown = known) => {
    const target = value.trim();
    if (!target) return;
    setError(null);
    setDisplay(null);
    setResult(null);
    setSavedId(null);
    setScanning(true);
    setTimeout(() => {
      const res = analyzeMessage(target, 'en', { isKnownContact: isKnown, senderInfo: isKnown ? 'Saved contact' : 'Unknown sender' });
      setScanning(false);
      if (res.isKnownContact) {
        setDisplay({
          score: 0,
          tier: 'LOW',
          statusText: 'Message from a saved / trusted contact',
          classification: 'Trusted contact — scanning bypassed',
          confidence: null,
          indicators: [],
          evidence: [res.explanation?.en, `Sender: ${res.senderInfo}`].filter(Boolean),
          recommendation: res.recommendation?.en,
          note: 'Deep-link and threat inspection is bypassed for saved contacts to protect privacy (existing AegisBorder AI behaviour). This result is not saved to history.',
        });
        return;
      }
      const indicators = uniq([
        ...res.matches.flatMap((m) => m.matchedKeywords || []),
        ...(res.extractedUrls?.length ? [`${res.extractedUrls.length} link(s) embedded`] : []),
        ...(res.extractedPhones?.length ? [`${res.extractedPhones.length} phone number(s) embedded`] : []),
      ]).slice(0, 8);
      const bloomMatches = (res.extractedUrls || []).filter((u) => globalBloomFilter.contains(parseUrl(u).hostname)?.match);
      if (bloomMatches.length) indicators.unshift(`${bloomMatches.length} link(s) listed on the Cyber Crime Blacklist (Bloom Filter)`);
      const evidence = [
        res.explanation || null,
        ...(bloomMatches.length ? [`Blacklist match: ${bloomMatches.join(', ')}`] : []),
        res.extractedUrls?.length ? `Embedded links: ${res.extractedUrls.join(', ')}` : null,
        res.extractedPhones?.length ? `Embedded numbers: ${res.extractedPhones.join(', ')}` : null,
      ].filter(Boolean);
      const score = res.riskScore ?? 0;
      const display = {
        score,
        tier: riskTierFromScore(score),
        statusText: res.isThreat ? 'Threat indicators detected' : 'No significant threat indicators detected',
        classification: (res.category || '').replace(/_/g, ' ') || (res.isThreat ? 'Suspicious message' : 'Normal message'),
        confidence: null,
        indicators,
        evidence,
        recommendation: res.recommendation || 'Do not interact with unknown senders or click embedded links.',
        note: 'On-device message analysis. Message content is scanned locally and is not sent to any server.',
      };
      setResult(res);
      setDisplay(display);
      announceThreat(display);
      const rec = addThreatToHistory('message', res, {
        target: target.length > 80 ? `${target.slice(0, 77)}…` : target,
        classification: res.category || (res.isThreat ? 'Suspicious message' : 'Normal message'),
        indicators,
        evidence,
        recommendation: res.recommendation,
        safe: !res.isThreat,
      });
      setSavedId(rec.id);
    }, 900);
  };

  return (
    <OperationShell
      icon={<MessageSquare className="h-5 w-5" aria-hidden="true" />}
      title="Message Scanner"
      subtitle="Analyze SMS, WhatsApp messages and suspicious conversations for scam, phishing and social-engineering patterns."
      inputs="SMS • WhatsApp • Text"
      onBack={onBack}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setKnown(false)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700 ${!known ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <UserX className="h-3.5 w-3.5" /> Unknown sender
          </button>
          <button
            type="button"
            onClick={() => setKnown(true)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700 ${known ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <UserCheck className="h-3.5 w-3.5" /> Saved contact
          </button>
        </div>

        <OperationInput
          as="textarea"
          label="Message content"
          hint={`${text.length} / 2000`}
          error={error}
          value={text}
          maxLength={2000}
          rows={6}
          placeholder="Paste the suspicious SMS or WhatsApp message here…"
          onChange={(e) => setText(e.target.value)}
        />

        <p className="text-xs font-semibold text-slate-500">Try an example</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setKnown(!!ex.known); run(ex.text, !!ex.known); }}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left transition-colors hover:border-navy-300 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
            >
              <span className="text-xs font-semibold text-slate-800">{ex.label}</span>
              <span className="mt-1 line-clamp-2 block text-[11px] text-slate-500">{ex.text}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="text-[11.5px] text-slate-500">Analysis runs on this device. Message text is not stored or transmitted.</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => { setText(''); setDisplay(null); setResult(null); setSavedId(null); }}
            disabled={!text} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
          <button type="button" onClick={() => run()}
            disabled={!text.trim() || scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Analyzing message…</> : <><Search className="h-4 w-4" aria-hidden="true" /> Analyze Message</>}
          </button>
        </div>

        {scanning && <p className="text-sm text-slate-500" aria-live="polite">Checking suspicious patterns, links and social-engineering signals…</p>}

        {display && !scanning && (
          <OperationResultCard
            display={display}
            savedId={savedId}
            onViewReport={() => setShowReport(true)}
            onRunNew={() => { setText(''); setDisplay(null); setResult(null); setSavedId(null); }}
          />
        )}
      </div>

      {showReport && savedId && result && <ThreatReport record={{ ...display, full: result, id: savedId, ts: new Date().toISOString(), person: 'Message Scanner', documentNumber: 'SMS / WhatsApp message', factors: display.indicators, evidence: display.evidence, recommendation: display.recommendation, classification: display.classification, riskScore: display.score, riskTier: display.tier }} onClose={() => setShowReport(false)} />}
    </OperationShell>
  );
}