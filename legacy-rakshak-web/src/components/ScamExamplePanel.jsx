import React from 'react';
import { X, FileText, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

/* Per-scam rich content */
const SCAM_DETAILS = {
  electricity: {
    original:
      'Dear customer aapka bijli bill update nahi hai, aaj raat 9 baje connection cut jayega. Call electricity nodal officer 9876543210 immediately to avoid disconnection.',
    risk: 'CRITICAL',
    why: [
      'Real electricity boards do not send disconnection notices from personal mobile numbers.',
      'You are pressured to act in hours, not days.',
      'You are told to call an unknown mobile number, not a toll-free helpline.',
      'No official customer ID or account number is referenced.',
    ],
    techniques: ['Urgency', 'Authority impersonation', 'Phone callback trap', 'Unknown number'],
    action:
      'Do not call the number. Open your last printed or official electricity bill to verify your account, and call the helpline printed on it.',
  },
  kyc: {
    original:
      'Dear SBI User, your YONO NetBanking will be blocked today due to pending KYC update. Click http://sbi-bank-kyc-update.top to reactivate account.',
    risk: 'CRITICAL',
    why: [
      'Banks never threaten to block accounts in 24 hours via unverified SMS links.',
      'The link uses a fake lookalike domain (sbi-bank-kyc-update.top) that is not the real onlinesbi.sbi.',
      'You are pushed to enter NetBanking credentials or OTPs on a phishing page.',
    ],
    techniques: ['Phishing link', 'Bank impersonation', 'Urgency', 'Credential theft'],
    action:
      'Open your bank’s official mobile app or type the bank’s verified website yourself. Never click a KYC link from SMS.',
  },
  cashback: {
    original:
      'upi://pay?pa=cashback-claim@ybl&am=4999&pn=PaytmReward&tn=Claim+Cashback+Reward',
    risk: 'CRITICAL',
    why: [
      'The UPI deep link will DEBIT ₹4,999 from your account — it is a payment request, not a reward.',
      'You cannot receive money by scanning a QR or entering a UPI PIN.',
      'Cashback / reward / lottery lures are the most common UPI fraud pattern.',
    ],
    techniques: ['UPI collect request', 'Deceptive reward', 'Urgency', 'PIN phishing'],
    action:
      'Do not scan or approve this request. You never enter your UPI PIN to receive money. Report the VPA to 1930.',
  },
  parcel: {
    original:
      'Your FedEx parcel is held at customs. Pay ₹89 customs fee to release delivery. http://fedex-customs.in/pay',
    risk: 'HIGH',
    why: [
      'Customs never collect small fees via a personal SMS link.',
      'The link uses a lookalike domain (fedex-customs.in) instead of the real fedex.com.',
      'You are pushed to enter card or UPI details on a phishing page.',
    ],
    techniques: ['Phishing link', 'Brand impersonation', 'Small fake fee', 'Credential theft'],
    action:
      'Track the parcel only on the courier’s official app or website. Customs duties, if real, are paid on the official portal — never via SMS links.',
  },
  job: {
    original:
      'Congratulations! You are shortlisted for a part-time role. Pay ₹299 interview fee to confirm your slot. http://job-offer-interview-fee.in',
    risk: 'MEDIUM',
    why: [
      'Real recruiters never ask candidates to pay any fee to be interviewed.',
      'The domain is brand new and unrelated to any company.',
      'You are pushed to act before you can verify the company.',
    ],
    techniques: ['Advance-fee scam', 'Lure', 'Off-platform contact'],
    action:
      'Search the company on LinkedIn and contact the recruiter through their official company email. Never pay any interview fee.',
  },
};

const riskClass = (r) => {
  if (r === 'CRITICAL' || r === 'HIGH') return 'badge-danger';
  if (r === 'MEDIUM') return 'badge-warning';
  return 'badge-success';
};

export default function ScamExamplePanel({ scam, onClose, onReport }) {
  if (!scam) return null;
  const details = SCAM_DETAILS[scam.id] || {
    original: '—',
    why: [],
    techniques: [],
    action: 'Be cautious and verify before acting.',
  };

  return (
    <div className="fixed inset-0 z-[80] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside className="ml-auto h-full w-full sm:max-w-md bg-[var(--bg-app)] border-l border-[var(--border-subtle)] flex flex-col animate-slide-in-right shadow-2xl">
        <div className="h-14 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-[var(--danger-text)] shrink-0" />
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
              {scam.title}
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 w-8 h-8" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Risk badge */}
          <div className="flex items-center gap-2">
            <span className={`badge ${riskClass(scam.risk)}`}>Risk: {scam.risk}</span>
            <span className="badge badge-neutral">{scam.cat}</span>
          </div>

          {/* Original */}
          <section className="panel p-3.5">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              Original message
            </h3>
            <p className="text-[12.5px] text-[var(--text-primary)] font-mono leading-relaxed break-words whitespace-pre-wrap">
              {details.original}
            </p>
          </section>

          {/* Why */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Why it is suspicious</h3>
            <ul className="space-y-1.5">
              {details.why.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-[var(--text-secondary)]">
                  <span className="w-4 h-4 rounded-full bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger-text)] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {w}
                </li>
              ))}
            </ul>
          </section>

          {/* Techniques */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Scam techniques detected</h3>
            <div className="flex flex-wrap gap-1.5">
              {details.techniques.map((t, i) => (
                <span key={i} className="chip">
                  {t}
                </span>
              ))}
            </div>
          </section>

          {/* What to do */}
          <section className="panel p-3.5 border-l-2 border-l-[var(--success)]">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--success-text)] mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              What the victim should do
            </h3>
            <p className="text-[12.5px] text-[var(--text-primary)] leading-relaxed">
              {details.action}
            </p>
          </section>

          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            <Info className="w-3 h-3 inline-block -mt-0.5 mr-0.5" />
            Patterns shown here are reconstructed from publicly reported scam templates. No real personal data is shown.
          </p>
        </div>

        <div className="border-t border-[var(--border-subtle)] p-3 flex items-center gap-2">
          <button onClick={onClose} className="btn btn-secondary btn-sm flex-1">
            Close
          </button>
          <button
            onClick={() => onReport && onReport(scam)}
            className="btn btn-danger btn-sm flex-1"
          >
            <FileText className="w-3.5 h-3.5" /> Report this scam
          </button>
        </div>
      </aside>
    </div>
  );
}
