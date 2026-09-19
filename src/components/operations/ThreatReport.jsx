import { useRef, useState } from 'react';
import { FileText, Printer, Download, FileJson, ShieldAlert } from 'lucide-react';
import { Button, Badge } from '../ui';
import { tierMeta, OPERATION_LABELS } from '../../lib/store';

function fmtTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

function Field({ k, v, mono }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs font-medium text-slate-500">{k}</span>
      <span className={`text-sm font-semibold text-slate-900 ${mono ? 'font-mono text-xs' : 'break-words text-right'}`}>{v || '—'}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

export default function ThreatReport({ record, onClose }) {
  const reportRef = useRef(null);
  const [isPdf, setIsPdf] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  const meta = tierMeta(record.riskTier);
  const opLabel = OPERATION_LABELS[record.operationType] || record.person || 'Threat Analysis';

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `threat_report_${record.id || 'record'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPDF = async () => {
    setIsPdf(true);
    setErrMsg(null);
    try {
      const [{ jsPDF }, html2canvas] = await Promise.all([import('jspdf'), import('html2canvas')]);
      const node = reportRef.current;
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = 210;
      const pageH = 297;
      const pages = Math.max(1, Math.ceil(canvas.height / (canvas.width / pageW * pageH)));
      const sliceH = Math.ceil(canvas.height / pages);
      for (let p = 0; p < pages; p++) {
        if (p > 0) pdf.addPage();
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(sliceH, canvas.height - p * sliceH);
        pageCanvas.getContext('2d').drawImage(canvas, 0, p * sliceH, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
        const img = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(img, 'JPEG', 0, 0, pageW, pageW * pageCanvas.height / pageCanvas.width);
      }
      pdf.save(`threat_report_${record.id || 'record'}.pdf`);
    } catch {
      setErrMsg('PDF generation failed. Use Export JSON or Print instead.');
    } finally {
      setIsPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Threat analysis report">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-navy-900 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-navy-300" />
            <span className="text-sm font-bold">Threat Analysis Report</span>
            <Badge color={meta.color}>{meta.label}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-navy-800">Close</Button>
            <Button variant="secondary" onClick={downloadJSON}><FileJson className="h-4 w-4" />JSON</Button>
            <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
            <Button onClick={downloadPDF} loading={isPdf}><Download className="h-4 w-4" />Download PDF</Button>
          </div>
        </div>
        {errMsg && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errMsg}</div>}

        <div ref={reportRef} className="flex-1 rounded-xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-navy-700">AegisBorder AI · Threat Defense</div>
              <h1 className="mt-1 text-xl font-extrabold">{opLabel}</h1>
              <p className="text-xs text-slate-500">Record {record.id || '—'} · scanned {fmtTs(record.ts)}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{record.riskScore ?? '—'}</div>
              <div className="text-xs font-semibold text-slate-500">Risk Score</div>
              <Badge color={meta.color} className="mt-1">{record.riskTier}</Badge>
            </div>
          </div>

          {record.recommendation && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Recommended action</div>
              <div className="text-sm font-bold">{record.recommendation}</div>
            </div>
          )}

          <Section title="Classification">
            <Field k="Operation" v={opLabel} />
            <Field k="Classification" v={record.classification} />
            <Field k="Target / identifier" v={record.documentNumber} mono />
            <Field k="Decision" v={record.decision} />
            <Field k="Watchlist flag" v={record.watchlistFlagged ? 'Yes' : 'No'} />
            {record.confidence != null && <Field k="Confidence" v={`${record.confidence}%`} />}
          </Section>

          <Section title="Indicators">
            {(record.factors || []).length > 0 ? (
              <ul className="space-y-1.5">
                {(record.factors || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />{f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No specific indicators recorded.</p>
            )}
          </Section>

          <Section title="Analysis detail">
            {(record.evidence || []).map((e, i) => (
              <div key={i} className="mb-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {e}
              </div>
            ))}
          </Section>

          <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
            <FileText className="h-3.5 w-3.5" />
            On-device analysis · Report generated by AegisBorder AI Threat Defense · Record retained in this session only
          </div>
        </div>
      </div>
    </div>
  );
}