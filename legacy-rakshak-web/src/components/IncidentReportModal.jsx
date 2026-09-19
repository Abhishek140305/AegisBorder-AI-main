import React, { useState } from 'react';
import { FileText, Copy, Check, ShieldAlert, Phone, ExternalLink, X } from 'lucide-react';

export default function IncidentReportModal({ isOpen, onClose, threatData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !threatData) return null;

  const incidentId = "CYBER-" + Math.floor(100000 + Math.random() * 900000);
  const timestamp = new Date().toLocaleString();

  const formattedReport = `=====================================================
NATIONAL CYBER CRIME REPORTING PORTAL (1930 / I4C)
INCIDENT FORENSIC REPORT - RAKSHAK AI DEFENCE
=====================================================
Incident ID: ${incidentId}
Date & Time: ${timestamp}
Threat Classification: ${threatData.category || threatData.title || 'PHISHING_FRAUD'}
Severity Level: ${threatData.riskScore >= 80 ? 'CRITICAL' : 'HIGH'} (Risk Score: ${threatData.riskScore}/100)

SUSPICIOUS ENTITY DETAILS:
Target / Domain / VPA: ${threatData.domain || threatData.vpa || threatData.appName || threatData.fullUrl || 'N/A'}
Phone / Contact: ${threatData.extractedPhones ? threatData.extractedPhones.join(', ') : 'N/A'}
Direct URLs: ${threatData.extractedUrls ? threatData.extractedUrls.join(', ') : (threatData.fullUrl || 'N/A')}

TECHNICAL DIAGNOSTICS:
${(threatData.reasons || []).map(r => "- " + r).join('\n') || '- Code-mixed social engineering threat pattern detected'}

PLAIN LANGUAGE SUMMARY:
${typeof threatData.explanation === 'object' ? (threatData.explanation.en || '') : (threatData.explanation || '')}

REPORTING JURISDICTION:
Ministry of Home Affairs (MHA) - Indian Cyber Crime Coordination Centre (I4C)
National Helpline: 1930 | Portal: https://cybercrime.gov.in
=====================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-2xl w-full p-5 sm:p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                National Cyber Crime Report (1930)
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Pre-formatted report for National Cyber Crime Portal (cybercrime.gov.in)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Preview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase">
              Pre-filled Police Report:
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '✓ Report Copied!' : 'Copy Report'}</span>
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] max-h-52 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
            {formattedReport}
          </pre>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <a
              href="tel:1930"
              className="btn-danger text-xs py-2 px-4"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Helpline 1930</span>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 px-3"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>cybercrime.gov.in</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
