import { useState } from 'react';
import { BrainCircuit, Loader2, Trash2, Sparkles, FileText, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { apiAiThreat } from '../../lib/api';
import { addThreatToHistory, riskTierFromScore } from '../../lib/store';
import { announceThreat } from '../../lib/voiceAlert';
import { globalBloomFilter } from '../../cyber/engine/bloomFilter';
import { parseUrl } from '../../cyber/engine/urlDetector';
import { Badge } from '../ui';
import { OperationShell, OperationResultCard, OperationInput } from './OperationShared';
import ThreatReport from './ThreatReport';

const EXAMPLES = [
  'Your electricity connection will be disconnected in 24 hours unless you pay the pending power bill of Rs 12,480. Reply YES or pay via this link immediately. - PowerGrid Support, 24x7 grievance cell.',
  'Based on your recent job application, you are shortlisted! Deposit Rs 2,450 as refundable registration fee to onedigitalcareeronline.com and receive your offer letter.',
  'Hi, this is Arjun from your building WhatsApp group. Can you share your OTP? My phone is not working and my app is asking for verification.',
];

export default function AiThreatOp({ onBack, healthState, onRefresh }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [display, setDisplay] = useState(null);
  const [result, setResult] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const run = async (value = content) => {
    const target = value.trim();
    if (!target) {
      setError('Paste a conversation, email or message to analyze.');
      setDisplay(null); setResult(null);
      return;
    }
    if (healthState?.state !== 'online') {
      setError('Backend offline — start the AegisBorder backend server, then Retry connection.');
      setDisplay(null); setResult(null);
      return;
    }
    setError(null); setDisplay(null); setResult(null); setSavedId(null);
    setScanning(true);
    try {
      const ai = await apiAiThreat(target);
      setScanning(false);
      const meta = { provider: ai.provider, model: ai.model, summary: ai.summary };
      const score = ai.risk_score ?? 5;
      const url = target.match(/https?:\/\/[^\s]+/i)?.[0] || null;
      const bloom = url ? globalBloomFilter.contains(parseUrl(url).hostname) : null;
      const evidence = [
        ai.summary ? `Summary: ${ai.summary}` : null,
        bloom?.match ? 'Embedded link is a direct match in the on-device Cyber Crime Blacklist (Bloom Filter).' : null,
        ai.provider === 'openai' ? `Analyzed by ${ai.model || 'OpenAI'} (server-side).` : 'Analyzed on-device by the local heuristic engine (no OpenAI key configured on the server).',
        ai.matched_pattern ? `Pattern detected: ${ai.matched_pattern}` : null,
        ...(ai.language ? [`Detected language: ${ai.language}`] : []),
      ].filter(Boolean);
      const display = {
        score,
        tier: riskTierFromScore(score),
        statusText: ai.is_threat ? 'AI pattern analysis indicates a scam attempt' : 'No scam patterns detected beyond the risk floor',
        classification: ai.category || (ai.is_threat ? 'Suspicious communication' : 'Benign communication'),
        confidence: null,
        indicators: [
          ...(ai.is_threat ? [`${ai.category || 'Suspected threat'} (pattern confidence ${score}/100)`] : []),
          ...(bloom?.match ? ['Link listed on Cyber Crime Blacklist (Bloom Filter)'] : []),
        ],
        evidence,
        recommendation: ai.is_threat
          ? 'Treat this as a scam: do not send money, OTPs, or passwords. Independently contact the institution via its official channel, and report to 1930 (National Cyber Helpline).'
          : 'No strong scam signals were detected. Stay alert to sandphishing tone, urgency, and any request for credentials.',
        note: ai.provider === 'openai'
          ? 'Content was sent to the configured OpenAI model on the server for analysis. Do not paste sensitive personal or financial data unless you trust your own server configuration.'
          : 'No OpenAI API key is configured on the server, so analysis used the offline heuristics engine that also powers the other operations. Absence of a match does not prove the content is safe.',
      };
      setResult({ ...ai, _meta: meta, bloomLookupMs: bloom?.lookupTimeMs, riskScore: score, riskTier: display.tier });
      setDisplay(display);
      announceThreat(display);
      const rec = addThreatToHistory('ai-analysis', { ...ai, _meta: meta, riskScore: score }, {
        target: target.slice(0, 80),
        classification: ai.category || (ai.is_threat ? 'Suspicious communication' : 'Benign communication'),
        indicators: ai.is_threat ? [ai.category || 'Suspected threat'] : [],
        evidence,
        recommendation: ai.is_threat ? 'Report to 1930; do not act on instructions in the message.' : 'No strong scam signals detected.',
        safe: !ai.is_threat,
      });
      setSavedId(rec.id);
    } catch (err) {
      setScanning(false);
      setError(err.message || 'Analysis failed. Is the backend running?');
    }
  };

  return (
    <OperationShell
      icon={<BrainCircuit className="h-5 w-5" aria-hidden="true" />}
      title="AI Threat Analysis"
      subtitle="Run a conversation, email or message through the AI analyst service for scam, impersonation and social-engineering pattern analysis."
      inputs="Conversation • Email • Message"
      onBack={onBack}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="text-[11.5px] text-slate-500">
{healthState?.state === 'online'
          ? 'Backend reachable — analysis runs on the server (local heuristic, or OpenAI if the server holds an API key).'
          : 'Backend offline — start the backend server, then Retry connection.'}
          </p>
          <Badge color={healthState?.state === 'online' ? 'green' : 'red'}>
            {healthState?.state === 'online' ? 'Backend online' : 'Backend offline'}
          </Badge>
          <button type="button" onClick={onRefresh} className="text-[11px] font-semibold text-navy-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            Retry connection
          </button>
        </div>

        <OperationInput
          as="textarea"
          label="Paste the suspicious message, email or conversation"
          hint="Keep sender-facing detail; omit real OTPs, passwords, card numbers or tokens."
          error={error}
          value={content}
          rows={6}
          placeholder="Your aadhaar-linked number is expiring. Pay Rs 199 now at aadhaarkyc-update.in to continue receiving government benefits…"
          onChange={(e) => setContent(e.target.value)}
        />

        <p className="text-xs font-semibold text-slate-500">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setContent(ex); run(ex); }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-700 transition-colors hover:border-navy-300 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
            >
              {i === 0 ? 'Bill disconnect scare' : i === 1 ? 'Fake job fee' : 'Friend OTP request'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => { setContent(''); setDisplay(null); setResult(null); setSavedId(null); }}
            disabled={!content} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
          <button type="button" onClick={() => run()}
            disabled={!content.trim() || scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700">
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Analyzing…</> : <><FileText className="h-4 w-4" aria-hidden="true" /> Analyze content</>}
          </button>
        </div>

        {display && !scanning && (
          <OperationResultCard
            display={display}
            savedId={savedId}
            onViewReport={() => setShowReport(true)}
            onRunNew={() => { setContent(''); setDisplay(null); setResult(null); setSavedId(null); }}
          />
        )}
      </div>

      {showReport && savedId && result && (
        <ThreatReport
          record={{
            ...display,
            id: savedId,
            ts: new Date().toISOString(),
            person: 'AI Threat Analysis',
            documentNumber: 'AI',
            factors: display.indicators,
            evidence: display.evidence,
            recommendation: display.recommendation,
            classification: display.classification,
            riskScore: display.score,
            riskTier: display.tier,
            full: result,
          }}
          onClose={() => setShowReport(false)}
        />
      )}

      {!scanning && !display && (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {result ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />}
          <p className="text-sm text-slate-600">
            The analyst flags payment-pressure language, impersonation of trusted institutions, credential/OTP requests and urgent-scarcity framing. Paste a real conversation to run a check.
          </p>
        </div>
      )}
    </OperationShell>
  );
}