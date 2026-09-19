import React from 'react';
import {
  Shield,
  ShieldCheck,
  Activity,
  MessageSquare,
  Globe,
  QrCode,
  AppWindow,
  ChevronRight,
  Smartphone,
  Plus,
  FileText,
  Phone,
} from 'lucide-react';
import { speakText } from './VoiceAssistant';
import { HOME, NAV_SUBS, t } from '../engine/regionalDictionary';

const ICONS = { message: MessageSquare, url: Globe, qr: QrCode, apk: AppWindow, app: AppWindow, link: Globe, upi: QrCode };
const QUICK_ACTION_KEYS = { message: 'scanMessage', url: 'checkWebsite', qr: 'checkQR', apk: 'checkApp' };

/* Demo security metrics (clearly demo values) — values are language-agnostic */
const METRICS = [
  { key: 'messages', value: '1,248', sub: { en: 'this device', hi: 'इस डिवाइस पर', ta: 'இந்த சாதனத்தில்', te: 'ఈ పరికరంలో', bn: 'এই ডিভাইসে', mr: 'या उपकरणावर' } },
  { key: 'threats',  value: '238',   sub: { en: 'blocked automatically', hi: 'स्वतः रोके गए', ta: 'தானாக தடுக்கப்பட்டன', te: 'ఆటోమేటిక్‌గా నిరోధించబడ్డాయి', bn: 'স্বয়ংক্রিয়ভাবে ব্লক হয়েছে', mr: 'आपोआप अडकले' } },
  { key: 'links',    value: '982',   sub: { en: 'this device', hi: 'इस डिवाइस पर', ta: 'இந்த சாதனத்தில்', te: 'ఈ పరికరంలో', bn: 'এই ডিভাইসে', mr: 'या उपकरणावर' } },
  { key: 'reported', value: '174',   sub: { en: 'helped protect others', hi: 'दूसरों की सुरक्षा में मदद', ta: 'மற்றவர்களைப் பாதுகாக்க உதவியது', te: 'ఇతరులను రక్షించడంలో సహాయం', bn: 'অন্যদের রক্ষায় সাহায্য', mr: 'इतरांना संरक्षित करण्यात मदत' } },
];

const PROTECTION_MODULE_IDS = ['message', 'link', 'upi', 'app'];
const QUICK_ACTION_IDS = ['message', 'url', 'qr', 'apk'];
const COMMON_SCAM_IDS = ['electricity', 'kyc', 'cashback', 'parcel', 'job'];
const DEVICE_KEYS = ['yourPhone', 'parentsPhone', 'childsPhone'];
const ACTIVITY_KEYS = ['suspiciousMessage', 'websiteChecked', 'upiIdVerified', 'appScanned', 'scamReported'];

const RISK_BADGE_LABELS = {
  CRITICAL: { en: 'CRITICAL', hi: 'गंभीर',     ta: 'தீவிரம்',    te: 'క్లిష్టం',      bn: 'গুরুতর',    mr: 'गंभीर' },
  HIGH:     { en: 'HIGH',     hi: 'उच्च',     ta: 'அதிக',     te: 'ఎక్కువ',         bn: 'উচ্চ',      mr: 'उच्च' },
  MEDIUM:   { en: 'MEDIUM',   hi: 'मध्यम',    ta: 'நடுத்தர',   te: 'మధ్యస్థం',     bn: 'মাঝারি',    mr: 'मध्यम' },
  CAUTION:  { en: 'CAUTION',  hi: 'सावधानी',   ta: 'கவனம்',     te: 'జాగ్రత్త',      bn: 'সতর্কতা',   mr: 'सावध' },
  SAFE:     { en: 'SAFE',     hi: 'सुरक्षित',  ta: 'பாதுகாப்பு', te: 'సురక్షితం',     bn: 'নিরাপদ',    mr: 'सुरक्षित' },
  REPORT:   { en: 'REPORT',   hi: 'रिपोर्ट',   ta: 'புகார்',    te: 'నివేదిక',       bn: 'রিপোর্ট',   mr: 'रिपोर्ट' },
};
const CAT_LABELS = {
  URGENCY:       { en: 'URGENCY',        hi: 'जल्दबाजी',     ta: 'அவசரம்',       te: 'అత్యవసరం',       bn: 'জরুরি',        mr: 'तातडी' },
  IMPERSONATION: { en: 'IMPERSONATION',  hi: 'प्रतिरूपण',    ta: 'போலி',         te: 'మోసం',           bn: 'ছদ্মবেশ',     mr: 'बनावट' },
  DECEPTION:     { en: 'DECEPTION',      hi: 'धोखा',         ta: 'ஏமாற்றம்',     te: 'మోసం',           bn: 'প্রতারণা',     mr: 'फसवणूक' },
  PHISHING:      { en: 'PHISHING',       hi: 'फिशिंग',       ta: 'ஃபிஷிங்',      te: 'ఫిషింగ్',        bn: 'ফিশিং',        mr: 'फिशिंग' },
  LURE:          { en: 'LURE',           hi: 'प्रलोभन',      ta: 'கவர்ச்சி',     te: 'ఆకర్షణ',         bn: 'প্রলোভন',     mr: 'आमिष' },
};

const riskBadge = (risk) => {
  if (risk === 'CRITICAL' || risk === 'HIGH')  return 'badge-danger';
  if (risk === 'CAUTION' || risk === 'MEDIUM') return 'badge-warning';
  if (risk === 'SAFE') return 'badge-success';
  if (risk === 'REPORT') return 'badge-info';
  return 'badge-neutral';
};

export default function HomeDashboard({ onTabChange, onOpenScamExample, currentLang = 'hi' }) {
  const h = new Date().getHours();
  const greetKey = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const greet = t(currentLang, HOME.greeting[greetKey]);

  return (
    <div className="space-y-5">
      {/* ---- Greeting + protection overview panel ---- */}
      <section className="panel-elevated p-5 sm:p-6">
        <div className="flex items-center gap-1.5 mb-1">
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
            {greet} <span aria-hidden>👋</span>
          </h1>
        </div>
        <p className="text-[13px] text-[var(--text-muted)] mb-5">
          {t(currentLang, HOME.tagline)}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left — shield + status */}
          <div className="lg:col-span-4 flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="w-12 h-12 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center shrink-0 border border-[var(--primary-border)]">
              <Shield className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="status-dot status-dot-success" />
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--success-text)]">
                  {t(currentLang, HOME.panels.protected)}
                </p>
              </div>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mt-1 leading-tight">
                {t(currentLang, HOME.protected)}
              </h2>
              <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5 leading-snug">
                {t(currentLang, HOME.checking)}
              </p>
            </div>
          </div>

          {/* Center — protection modules */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-2">
            {PROTECTION_MODULE_IDS.map((id) => {
              const Icon = ICONS[id];
              return (
                <div key={id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <Icon className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[var(--text-primary)] leading-tight">
                      {t(currentLang, HOME.panels[id])}
                    </p>
                    <p className="text-[10.5px] text-[var(--success-text)] font-semibold leading-tight">
                      {t(currentLang, HOME.panels.statusActive)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right — last checked + view activity */}
          <div className="lg:col-span-3 flex flex-col justify-between p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t(currentLang, HOME.lastChecked)}
              </p>
              <p className="text-[14px] font-semibold text-[var(--text-primary)] mt-0.5">
                {t(currentLang, HOME.justNow)}
              </p>
            </div>
            <button
              onClick={() => onTabChange && onTabChange('message')}
              className="btn btn-secondary btn-sm w-full mt-3"
            >
              <Activity className="w-3.5 h-3.5" />
              {t(currentLang, HOME.viewActivity)}
            </button>
          </div>
        </div>
      </section>

      {/* ---- Metrics row ---- */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {METRICS.map(m => (
          <div key={m.key} className="panel p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t(currentLang, HOME.metrics[m.key])}
            </p>
            <p className="text-[20px] font-semibold text-[var(--text-primary)] mt-1 tabular-nums leading-tight">{m.value}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{t(currentLang, m.sub)}</p>
          </div>
        ))}
      </section>

      <p className="text-[11px] text-[var(--text-muted)] -mt-2 px-1">
        {t(currentLang, HOME.demoNote)}
      </p>

      {/* ---- Quick actions ---- */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
            {t(currentLang, HOME.whatDoYouWant)}
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTION_IDS.map((id) => {
            const Icon = ICONS[id];
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="panel p-4 text-left hover:border-[var(--border-medium)] transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-[var(--primary-subtle)] flex items-center justify-center mb-2.5">
                  <Icon className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <p className="text-[13.5px] font-semibold text-[var(--text-primary)] leading-tight">
                  {t(currentLang, HOME.quickActions[QUICK_ACTION_KEYS[id]])}
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  {t(currentLang, NAV_SUBS[id])}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- Common scams ---- */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
              {t(currentLang, HOME.scams.title)}
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              {t(currentLang, HOME.scams.subtitle)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMMON_SCAM_IDS.map((id) => {
            const scam = HOME.commonScams[id];
            return (
              <article key={id} className="panel p-4 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="badge badge-neutral">
                    {t(currentLang, CAT_LABELS[scam.cat] || { en: scam.cat })}
                  </span>
                  <span className={`badge ${riskBadge(scam.risk)}`}>
                    {t(currentLang, RISK_BADGE_LABELS[scam.risk] || { en: scam.risk })}
                  </span>
                </div>
                <h3 className="text-[13.5px] font-semibold text-[var(--text-primary)] leading-tight">
                  {t(currentLang, scam.title)}
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-1 leading-snug flex-1">
                  {t(currentLang, scam.desc)}
                </p>
                <button
                  onClick={() => onOpenScamExample && onOpenScamExample({ id, ...scam, cat: scam.cat, risk: scam.risk, title: t(currentLang, scam.title) })}
                  className="text-[12px] font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1 mt-2 self-start"
                >
                  {t(currentLang, HOME.scams.seeExample)} <ChevronRight className="w-3 h-3" />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* ---- Two-column: activity + family protection ---- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel p-4 sm:p-5">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">
            {t(currentLang, HOME.recentActivity.title)}
          </h2>
          <p className="text-[11.5px] text-[var(--text-muted)] mb-3">
            {t(currentLang, HOME.recentActivity.subtitle)}
          </p>
          <div>
            {ACTIVITY_KEYS.map((key, i) => {
              const a = ACTIVITY_TIMES[i];
              const Icon = a.icon;
              return (
                <div key={i} className="activity-row">
                  <div className="w-7 h-7 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[var(--text-primary)] leading-tight truncate">
                      {t(currentLang, HOME.activityLabels[key])}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">{t(currentLang, a.time)}</p>
                  </div>
                  <span className={`badge ${riskBadge(a.risk)}`}>
                    {t(currentLang, RISK_BADGE_LABELS[a.risk] || { en: a.risk })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
              {t(currentLang, HOME.familyProtection.title)}
            </h2>
            <span className="text-[11.5px] text-[var(--text-muted)]">
              {DEVICE_KEYS.length} {t(currentLang, HOME.familyProtection.devices)}
            </span>
          </div>
          <p className="text-[11.5px] text-[var(--text-muted)] mb-3">
            {t(currentLang, HOME.familyProtection.allProtected)}
          </p>
          <div className="space-y-2">
            {DEVICE_KEYS.map(key => (
              <div key={key} className="device-row">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                    <Smartphone className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  </div>
                  <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                    {t(currentLang, HOME.deviceProtection[key])}
                  </p>
                </div>
                <span className="badge badge-success">
                  <ShieldCheck className="w-3 h-3" />
                  {t(currentLang, HOME.panels.protected)}
                </span>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm w-full">
              <Plus className="w-3.5 h-3.5" /> {t(currentLang, HOME.panels.addDevice)}
            </button>
          </div>
        </div>
      </section>

      {/* ---- Privacy + Help ---- */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel p-4 sm:p-5">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1.5">
            {t(currentLang, HOME.privacy.title)}
          </h2>
          <ul className="space-y-1.5 text-[12.5px] text-[var(--text-secondary)]">
            {HOME.privacy.list.map((item, i) => (
              <li key={i}>✓ {t(currentLang, item)}</li>
            ))}
          </ul>
        </div>

        <div className="panel p-4 sm:p-5 flex flex-col">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1.5">
            {t(currentLang, HOME.privacy.foundScam)}
          </h2>
          <p className="text-[12.5px] text-[var(--text-secondary)] leading-snug flex-1">
            {t(currentLang, HOME.privacy.reportText)}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button className="btn btn-primary btn-sm">
              <FileText className="w-3.5 h-3.5" /> {t(currentLang, HOME.privacy.reportScam)}
            </button>
            <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
              <Phone className="w-3.5 h-3.5" />
              {t(currentLang, HOME.privacy.cyberHelpline)} <strong className="text-[var(--text-primary)]">1930</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const ACTIVITY_TIMES = [
  { time: { en: '10:30 AM', hi: 'सुबह 10:30', ta: 'காலை 10:30', te: 'ఉదయం 10:30', bn: 'সকাল 10:30', mr: 'सकाळी 10:30' }, icon: MessageSquare, risk: 'HIGH' },
  { time: { en: '09:45 AM', hi: 'सुबह 09:45', ta: 'காலை 09:45', te: 'ఉదయం 09:45', bn: 'সকাল 09:45', mr: 'सकाळी 09:45' }, icon: Globe,         risk: 'SAFE' },
  { time: { en: '09:20 AM', hi: 'सुबह 09:20', ta: 'காலை 09:20', te: 'ఉదయం 09:20', bn: 'সকাল 09:20', mr: 'सकाळी 09:20' }, icon: QrCode,        risk: 'SAFE' },
  { time: { en: 'Yesterday', hi: 'कल', ta: 'நேற்று', te: 'నిన్న', bn: 'গতকাল', mr: 'काल' }, icon: AppWindow, risk: 'CAUTION' },
  { time: { en: '2 days ago', hi: '2 दिन पहले', ta: '2 நாட்களுக்கு முன்பு', te: '2 రోజుల క్రితం', bn: '২ দিন আগে', mr: '2 दिवसांपूर्वी' }, icon: FileText, risk: 'REPORT' },
];
