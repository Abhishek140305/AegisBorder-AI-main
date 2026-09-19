import React from 'react';
import { Play, Sparkles, MessageSquare, Globe, QrCode, ShieldAlert, Database } from 'lucide-react';

export const DEMO_PRESETS = [
  {
    id: 'preset-hinglish-sms',
    title: 'Electricity Bill Scam',
    tag: 'SMS / WhatsApp',
    badgeClass: 'badge-warning',
    icon: MessageSquare,
    description: '“Aapka bijli bill update nahi hai, connection cut ho jayega…”',
    targetTab: 'message',
    data: {
      message: 'Dear customer aapka bijli bill update nahi hai, aaj raat 9 baje connection cut jayega. Call electricity nodal officer immediately 9876543210 to avoid penalty.'
    }
  },
  {
    id: 'preset-typosquat-url',
    title: 'Fake SBI Bank Link',
    tag: 'Phishing Link',
    badgeClass: 'badge-danger',
    icon: Globe,
    description: 'sbi-bank-kyc-update.top (Looks like official bank website)',
    targetTab: 'url',
    data: {
      url: 'http://sbi-bank-kyc-update.top/login.php'
    }
  },
  {
    id: 'preset-upi-trap',
    title: 'Fake ₹4,999 Cashback',
    tag: 'UPI QR Trap',
    badgeClass: 'badge-danger',
    icon: QrCode,
    description: 'Deceptive payment request asking user to enter UPI PIN',
    targetTab: 'qr',
    data: {
      qrPayload: 'upi://pay?pa=cashback-claim@ybl&am=4999&pn=PaytmReward&tn=Congratulations+Claim+4999+Cashback'
    }
  },
  {
    id: 'preset-malicious-apk',
    title: 'Dangerous Spy APK',
    tag: 'Malicious App',
    badgeClass: 'badge-danger',
    icon: ShieldAlert,
    description: 'Customer_Support.apk asking for private SMS & screen permissions',
    targetTab: 'apk',
    data: {
      apkUrl: 'http://customer-support-app.net/AnyDesk_Support.apk'
    }
  },
  {
    id: 'preset-poa-block',
    title: 'Verified Scam Registry',
    tag: 'Cyber Police 1930',
    badgeClass: 'badge-safe',
    icon: Database,
    description: 'Check official scam database shared with Banks & Police',
    targetTab: 'blockchain',
    data: {
      target: 'scam-paytm@ybl',
      type: 'DECEPTIVE_UPI_VPA',
      details: 'Active mass-phishing campaign in tier-3 districts'
    }
  }
];

export default function JudgePresetBar({ onSelectPreset, activePresetId }) {
  return (
    <section className="mb-6 p-4 sm:p-5 card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[var(--primary)] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
              Try Common Scam Examples (उदाहरण देखें)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Click any real-world scam scenario below to see how Rakshak protects you:
            </p>
          </div>
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {DEMO_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = activePresetId === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-[var(--primary)] bg-[var(--primary-subtle)] shadow-sm ring-1 ring-[var(--primary)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-surface-subtle)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className={preset.badgeClass}>
                    {preset.tag}
                  </span>
                  <div className={`p-1 rounded-md transition-colors ${isActive ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)]'}`}>
                    <Play className="w-3 h-3" />
                  </div>
                </div>
                <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] mb-1">
                  {preset.title}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
