import React from 'react';
import { Lock, Phone, Globe, ExternalLink, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import legitimateData from '../data/legitimateInstitutions.json';

export default function SafeSandboxModal({ isOpen, onClose, threatData }) {
  if (!isOpen || !threatData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-2xl w-full p-5 sm:p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[var(--primary)] flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Safe Sandbox & Official Contacts
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Compare fake links against official government and bank helplines
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

        {/* Spoofing Comparison Banner */}
        {threatData.spoofedTarget && (
          <div className="p-4 rounded-xl card-warning mb-4">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Fake Website Impersonation Detected</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg card-danger">
                <span className="text-[10px] text-red-700 dark:text-red-400 block font-bold">FAKE SCAM LINK:</span>
                <span className="font-mono text-red-900 dark:text-red-200 font-bold truncate block">{threatData.domain || threatData.fullUrl}</span>
              </div>
              <div className="p-2.5 rounded-lg card-safe">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold">OFFICIAL REAL WEBSITE:</span>
                <span className="font-mono text-emerald-900 dark:text-emerald-200 font-bold truncate block">{threatData.officialDomain || 'sbi.co.in'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Official Helpline Direct Contact */}
        <div className="mb-4 p-4 rounded-xl card bg-[var(--bg-surface-subtle)] space-y-2">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Official Emergency Helplines (आपातकालीन नंबर)</span>
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">National Cyber Crime Reporting Helpline</div>
                <div className="text-[11px] text-[var(--text-muted)]">Available 24x7 to freeze stolen money</div>
              </div>
              <a 
                href="tel:1930" 
                className="btn-primary text-xs py-1.5 px-3"
              >
                Call 1930
              </a>
            </div>

            {threatData.officialHelpline && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">{threatData.spoofedTarget || 'Official Bank'} Helpline</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Official toll-free support</div>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--primary)]">
                  {threatData.officialHelpline}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legitimate Banks Directory */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Official Bank Portals</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
            {legitimateData.banks.map((bank, i) => (
              <div key={i} className="p-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-xs">
                <div className="font-semibold text-[var(--text-primary)]">{bank.name}</div>
                <div className="text-[10px] font-mono text-[var(--primary)] truncate">{bank.officialDomains[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full btn-secondary text-xs py-2.5 justify-center"
        >
          Close
        </button>

      </div>
    </div>
  );
}
