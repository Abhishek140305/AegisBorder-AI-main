import React, { useEffect, useRef, useState } from 'react';
import { AppWindow, Loader2, Search, Trash2 } from 'lucide-react';
import { inspectApk } from '../engine/apkInspector';
import RiskResultCard from './RiskResultCard';
import { SCANNER, t } from '../engine/regionalDictionary';

const CHECK_APP_LABELS = { en: 'Check app', hi: 'ऐप चेक करें', ta: 'ஆப்பைச் சரி', te: 'అప్ చెక్ చేయండి', bn: 'অ্যাপ চেক করুন', mr: 'अ‍ॅप तपासा' };
const REVIEWING_APP_LABELS = { en: 'Reviewing app', hi: 'ऐप समीक्षा हो रही है', ta: 'ஆப் மீட்டரையும்', te: 'అప్ సమీక్షిస్తుంది', bn: 'অ্যাপ পর্যালোচনা হচ্ছে', mr: 'अ‍ॅप तपासणी' };
const TITLE_LABELS = { en: 'Check app permissions', hi: 'ऐप अनुमतियाँ जाँचें', ta: 'ஆப் அனுமதிகளைத் தேடு', te: 'అప్ అనుమతులను పరిశీలించండి', bn: 'অ্যাপ অনুমতি যাচাই করুন', mr: 'अ‍ॅप अनुमती तपासा' };
const SUBTITLE_LABELS = { en: 'Paste an APK URL or package name to see if it has dangerous permissions.', hi: 'खतरनाक अनुमतियों वाले APK URL या पैकेज नाम को देखने के लिए पेस्ट करें।', ta: 'அபாயகரமான அனுமதிகளைக் கொண்ட APK URL அல்லது பெட்டியன் பெயரைப் பார்க்க ஒட்டவும்.', te: 'భయపడతున్న అనుమతులను కలిగి ఉన్న APK URL లేదా ప్యాకేజ్ పేరు చూడటానికి పెట్టండి.', bn: 'বিপজ্জনক অনুমতি সহ APK URL বা প্যাকেজ নাম দেখতে পেস্ট করুন।', mr: 'एकांत अनुमती असलेला APK URL किंवा पॅकेज नाव पाहण्यासाठी पेस्ट करा.' };
const SAMPLE_LABELS = {
  anydesk: { en: 'Fake AnyDesk support',  hi: 'फर्जी AnyDesk सहायता', ta: 'போரேடு AnyDesk உதவி', te: 'మోసాల AnyDesk సహాయం', bn: 'ফর্জ AnyDesk সহায়তা', mr: 'बनावट AnyDesk मदत' },
  bijli:   { en: 'Fake bijli bill portal', hi: 'फर्जी बिजली बिल पोर्टल', ta: 'போரேடு மின் சட்டம் தளம்', te: 'మోసాల విద్యుత్ బిల్ పోర్టల్', bn: 'ফর্জ বিদ্যুৎ বিল পোর্টাল', mr: 'बनावट वीज बिल पोर्टल' },
  sbiKyc:  { en: 'Fake SBI KYC helper',   hi: 'फर्जी SBI KYC सहायक', ta: 'போரேடு SBI KYC உதவியாளர்', te: 'మోసాల SBI KYC సహాయకుడు', bn: 'ফর্জ SBI KYC সহায়ক', mr: 'बनावट SBI KYC सहायक' },
};
const SAMPLE_APKS = [
  { labelKey: 'anydesk', url: 'http://customer-support-app.net/AnyDesk_Support.apk' },
  { labelKey: 'bijli',   url: 'http://bijli-bill-payment-portal.cc/Bijli_Update.apk' },
  { labelKey: 'sbiKyc',  url: 'com.sbi.kyc.verification.doc' },
];

export default function ApkPermScanner({ currentLang = 'hi', onOpenReport, onMintBlock, initialApk = '', onResult }) {
  const [input, setInput] = useState(initialApk);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    if (initialApk && initialApk !== input) setInput(initialApk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialApk]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const runScan = (data = input) => {
    if (!data.trim()) return;
    setResult(null);
    setIsScanning(true);
    setScanStep(1);
    const steps = SCANNER.steps.apk[currentLang] || SCANNER.steps.apk.en;
    for (let i = 2; i <= steps.length; i++) {
      timers.current.push(setTimeout(() => setScanStep(i), 250 * (i - 1)));
    }
    timers.current.push(setTimeout(() => {
      const res = inspectApk(data);
      setResult(res);
      setIsScanning(false);
      setScanStep(0);
      if (onResult) onResult(res);
    }, 250 * steps.length + 200));
  };

  return (
    <div className="space-y-4">
      <section className="panel-elevated p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center shrink-0">
            <AppWindow className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{t(currentLang, TITLE_LABELS)}</h2>
            <p className="text-[12.5px] text-[var(--text-muted)]">{t(currentLang, SUBTITLE_LABELS)}</p>
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(currentLang, SCANNER.placeholders.apk)}
            className="input"
          />
        </div>

        <div className="mt-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{t(currentLang, SCANNER.examples)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_APKS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInput(s.url); runScan(s.url); }}
                className="text-left p-2.5 rounded-md border border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <p className="text-[12.5px] font-medium text-[var(--text-primary)] leading-tight">{t(currentLang, SAMPLE_LABELS[s.labelKey])}</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 font-mono">{s.url}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <button onClick={() => setInput('')} disabled={!input} className="btn btn-ghost btn-sm">
            <Trash2 className="w-3.5 h-3.5" />{t(currentLang, SCANNER.buttons.clear)}
          </button>
          <button onClick={() => runScan()} disabled={!input.trim() || isScanning} className="btn btn-primary">
            {isScanning ? (<><Loader2 className="w-4 h-4 animate-spin-slow" />{t(currentLang, SCANNER.buttons.analyzing)}</>) : (<><Search className="w-4 h-4" />{t(currentLang, CHECK_APP_LABELS)}</>)}
          </button>
        </div>
      </section>

      {isScanning && (
        <section className="panel-elevated p-5 animate-fade-in" aria-live="polite">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-3.5 h-3.5 text-[var(--primary)] animate-spin-slow" />
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{t(currentLang, REVIEWING_APP_LABELS)}</h3>
          </div>
          <div className="space-y-0.5">
            {(SCANNER.steps.apk[currentLang] || SCANNER.steps.apk.en).map((label, i) => {
              const stepNum = i + 1;
              const done = scanStep > stepNum;
              const active = scanStep === stepNum;
              return (
                <div key={label} className={`scan-step ${done ? 'done' : active ? 'active' : ''}`}>
                  <span className="step-icon">{done ? '✓' : ''}</span>{label}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {result && !isScanning && (
        <RiskResultCard
          result={result}
          currentLang={currentLang}
          onOpenReport={onOpenReport}
          onMintBlock={onMintBlock}
        />
      )}
    </div>
  );
}
