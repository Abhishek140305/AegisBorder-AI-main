import React, { useEffect, useRef, useState } from 'react';
import { Globe, Loader2, Search, Trash2 } from 'lucide-react';
import { inspectUrl } from '../engine/urlDetector';
import RiskResultCard from './RiskResultCard';
import { SCANNER, HOME, t } from '../engine/regionalDictionary';

const CHECK_LINK_LABELS = { en: 'Check link', hi: 'लिंक चेक करें', ta: 'இணைப்பைச் சரி', te: 'లింక్ చెక్ చేయండి', bn: 'লিংক চেক করুন', mr: 'दुवा तपासा' };
const CHECKING_LINK_LABELS = { en: 'Checking link', hi: 'लिंक चेक हो रही है', ta: 'இணைப்பைச் சரிசார்க்கிறது', te: 'లింక్ పరిశీలిస్తుంది', bn: 'লিংক চেক করছে', mr: 'दुवा तपासत आहे' };
const TITLE_LABELS = { en: 'Check a suspicious website', hi: 'संदिग्ध वेबसाइट जाँचें', ta: 'தெளிவான இணையதளத்தைச் சரி', te: 'సందిగ్ధ వెబ్సైట్ చెక్ చేయండి', bn: 'সন্দেহজনক ওয়েবসাইট যাচাই করুন', mr: 'संदिग्ध वेबसाइट तपासा' };
const SUBTITLE_LABELS = { en: 'Paste any link to verify if it is the official site or a fake clone.', hi: 'किसी भी लिंक को पेस्ट करें और जाँचें कि यह आधिकारिक साइट है या नकली।', ta: 'எந்த இணைப்பையும் ஒட்டவும், அது அதிகாரபூர்வமானதா அல்லது போரேடு நகலா என்பதைச் சரிசார்க்கவும்.', te: 'ఏదైనా లింక్ పెట్టండి, అది అధికారిక సైటో లేదా మోస టపో కాదో నిర్ధారించండి.', bn: 'যেকোনো লিংক পেস্ট করে দেখুন এটি আসল সাইট নাকি নকল ক্লোন।', mr: 'कोणताही दुवा पेस्ट करा आणि तो अधिकृत साइट आहे का बनावट आहे ते तपासा.' };

const SAMPLE_URLS = [
  { titleKey: 'fakeSBI',  url: 'http://sbi-bank-kyc-update.top/login.php', safe: false },
  { titleKey: 'officialSBI', url: 'https://onlinesbi.sbi',                   safe: true },
  { titleKey: 'fakeJio',   url: 'http://free-recharge-jio-5g.live',         safe: false },
  { titleKey: 'officialHDFC', url: 'https://hdfcbank.com',                     safe: true },
];

export default function UrlScanner({ currentLang = 'hi', onOpenReport, onMintBlock, onOpenSandbox, initialUrl = '', onResult }) {
  const [input, setInput] = useState(initialUrl);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    if (initialUrl && initialUrl !== input) setInput(initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const runScan = (url = input) => {
    if (!url.trim()) return;
    setResult(null);
    setIsScanning(true);
    setScanStep(1);
    const steps = SCANNER.steps.url[currentLang] || SCANNER.steps.url.en;
    for (let i = 2; i <= steps.length; i++) {
      timers.current.push(setTimeout(() => setScanStep(i), 280 * (i - 1)));
    }
    timers.current.push(setTimeout(() => {
      const res = inspectUrl(url, currentLang);
      setResult(res);
      setIsScanning(false);
      setScanStep(0);
      if (onResult) onResult(res);
    }, 280 * steps.length + 200));
  };

  return (
    <div className="space-y-4">
      <section className="panel-elevated p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-[var(--primary)]" />
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
            placeholder={t(currentLang, SCANNER.placeholders.url)}
            className="input"
          />
        </div>

        <div className="mt-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{t(currentLang, SCANNER.examples)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_URLS.map((s, i) => {
              const title = t(currentLang, SCANNER.sampleLabels[s.titleKey] || { en: s.titleKey });
              return (
              <button
                key={i}
                onClick={() => { setInput(s.url); runScan(s.url); }}
                className="text-left p-2.5 rounded-md border border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <p className="text-[12.5px] font-medium text-[var(--text-primary)] leading-tight">{title}</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 font-mono">{s.url}</p>
              </button>
            );})}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <button onClick={() => setInput('')} disabled={!input} className="btn btn-ghost btn-sm">
            <Trash2 className="w-3.5 h-3.5" />{t(currentLang, SCANNER.buttons.clear)}
          </button>
          <button onClick={() => runScan()} disabled={!input.trim() || isScanning} className="btn btn-primary">
            {isScanning ? (<><Loader2 className="w-4 h-4 animate-spin-slow" />{t(currentLang, SCANNER.buttons.analyzing)}</>) : (<><Search className="w-4 h-4" />{t(currentLang, CHECK_LINK_LABELS)}</>)}
          </button>
        </div>
      </section>

      {isScanning && (
        <section className="panel-elevated p-5 animate-fade-in" aria-live="polite">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-3.5 h-3.5 text-[var(--primary)] animate-spin-slow" />
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{t(currentLang, CHECKING_LINK_LABELS)}</h3>
          </div>
          <div className="space-y-0.5">
            {(SCANNER.steps.url[currentLang] || SCANNER.steps.url.en).map((label, i) => {
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
