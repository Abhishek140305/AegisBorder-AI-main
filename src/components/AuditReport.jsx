import React, { useRef, useState } from 'react';
import { FileText, Printer, Download, KeyRound, ShieldCheck, FileJson } from 'lucide-react';
import { Button, Badge } from './ui';
import { tierMeta } from '../lib/store';

function fmtTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function Field({ k, v, mono }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs font-medium text-slate-500">{k}</span>
      <span className={`text-sm font-semibold text-slate-900 ${mono ? 'font-mono text-xs' : ''}`}>{v || '—'}</span>
    </div>
  );
}

function Section({ title, children, id }) {
  return (
    <section id={id} className="mt-6">
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

export default function AuditReport({ screening, onClose }) {
  const reportRef = useRef(null);
  const [isPdf, setIsPdf] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  const audit = screening?.audit_report || {};
  const risk = screening?.risk_assessment || {};
  const mrz = screening?.extracted_data?.mrz || {};
  const viz = screening?.extracted_data?.viz || {};
  const bio = screening?.biometrics || {};
  const forensics = screening?.forensics?.summary || {};
  const docVal = screening?.document_validation || {};
  const watch = screening?.watchlist_screening || {};
  const meta = tierMeta(risk.risk_tier);

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(screening, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `screening_report_${audit.audit_id || 'record'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPDF = async () => {
    setIsPdf(true);
    setErrMsg(null);
    try {
      const [{ jsPDF }, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
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
      pdf.save(`screening_report_${audit.audit_id || 'record'}.pdf`);
    } catch {
      setErrMsg('PDF generation failed. Use Export JSON or Print instead.');
    } finally {
      setIsPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Screening report">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-navy-900 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-navy-300" />
            <span className="text-sm font-bold">Border Inspection Audit Certificate</span>
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
              <div className="text-xs font-bold uppercase tracking-widest text-navy-700">AegisBorder AI · Integrated Screening Station</div>
              <h1 className="mt-1 text-xl font-extrabold">Border Inspection Audit Certificate</h1>
              <p className="text-xs text-slate-500">Case {audit.audit_id || '—'} · issued {fmtTs(audit.timestamp)}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{risk.overall_risk_score ?? '—'}</div>
              <div className="text-xs font-semibold text-slate-500">Composite Risk Score</div>
              <Badge color={meta.color} className="mt-1">{risk.risk_tier}</Badge>
            </div>
          </div>

          {risk.recommended_decision && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Recommended action</div>
              <div className="text-base font-bold">{risk.recommended_decision}</div>
              {risk.action_summary && <p className="mt-1 text-sm text-slate-600">{risk.action_summary}</p>}
            </div>
          )}

          <Section title="Holder & Document">
            <Field k="Full name" v={mrz.full_name || viz.full_name} />
            <Field k="Document number" v={mrz.document_number || viz.document_number} mono />
            <Field k="Document type" v={`${mrz.document_type || ''} (${mrz.format || ''})`.trim()} />
            <Field k="Nationality" v={mrz.nationality || viz.nationality} />
            <Field k="Date of birth" v={mrz.date_of_birth || viz.date_of_birth} />
            <Field k="Date of expiry" v={mrz.date_of_expiry || viz.date_of_expiry} />
            <Field k="Sex" v={mrz.sex || viz.sex} />
          </Section>

          <Section title="Validation">
            <Field k="Document valid" v={docVal.is_valid ? 'Yes' : 'No'} />
            <Field k="Expired" v={docVal.is_expired ? 'Yes' : 'No'} />
            <Field k="Validation score" v={docVal.validation_score != null ? `${docVal.validation_score}%` : '—'} />
            {docVal.discrepancies?.length > 0 && (
              <ul className="mt-2 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {docVal.discrepancies.map((d, i) => (
                  <li key={i}>• {d.description || `${d.field}: ${d.category}`}</li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Forensics & Biometrics">
            <Field k="Photo tampering" v={forensics.is_photo_tampered ? 'Detected' : 'None detected'} />
            <Field k="ELA score" v={`${Number(forensics.ela_score ?? 0).toFixed(1)}%`} />
            <Field k="Noise discrepancy" v={`${Number(forensics.noise_discrepancy_score ?? 0).toFixed(1)}%`} />
            <Field k="Metadata tampering" v={`${Number(forensics.metadata_tamper_score ?? 0).toFixed(1)}%`} />
            <Field k="Face match" v={bio.biometric_available === false ? 'Not performed (no live capture)' : (bio.is_matched ? `Matched (${bio.match_score}%)` : (bio.match_score != null ? `Not matched (${bio.match_score}%)` : 'No capture'))} />
            <Field k="Liveness" v={bio.biometric_available === false ? 'Not performed' : (bio.liveness?.is_live ? 'Live' : (bio.liveness ? 'Failed' : 'No capture'))} />
          </Section>

          <Section title="Compliance & Watchlist">
            <Field k="Watchlist flagged" v={watch.flagged ? 'Yes' : 'No'} />
            {watch.alerts?.map((a, i) => (
              <div key={i} className="mb-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                <span className="font-bold">{a.alert_type}</span> · {a.reason}
              </div>
            ))}
          </Section>

          <Section title="Reasons for decision">
            {(risk.risk_factors || []).map((f, i) => (
              <div key={i} className="mb-1.5 flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <span className="font-semibold text-slate-800">{f.module || f.severity}: </span>
                  <span className="text-slate-600">{f.description}</span>
                </div>
                {f.impact && <span className="shrink-0 text-xs font-bold text-slate-500">{f.impact}</span>}
              </div>
            ))}
          </Section>

          <Section title="Cryptographic audit trail">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <KeyRound className="h-3.5 w-3.5" /> SHA-256 signature
              </div>
              <div className="mt-1 break-all font-mono text-xs text-slate-700 select-all">{audit.cryptographic_hash}</div>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-500 sm:grid-cols-3">
                <div>Officer: <span className="font-semibold text-slate-700">{audit.officer_id}</span></div>
                <div>Checkpoint: <span className="font-semibold text-slate-700">{audit.checkpoint_id}</span></div>
                <div>Algorithm: <span className="font-semibold text-slate-700">{audit.signature_algorithm}</span></div>
              </div>
            </div>
          </Section>

          <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
            <FileText className="h-3.5 w-3.5" />
            Report generated by AegisBorder AI screening pipeline · Record retained in this session only
          </div>
        </div>
      </div>
    </div>
  );
}