import React, { useEffect, useRef, useState } from 'react';
import { QrCode, Loader2, Search, Trash2, AlertTriangle } from 'lucide-react';
import { parseUpiPayload } from '../engine/upiQrDetector';
import RiskResultCard from './RiskResultCard';
import { SCANNER, t } from '../engine/regionalDictionary';

const GOLDEN_RULE_LABELS = {
  en: { rule: 'Golden rule:', rest: 'UPI PIN is only to send money. You never need a PIN to receive money or cashback.' },
  hi: { rule: 'सुनहरा नियम:', rest: 'UPI PIN केवल पैसे भेजने के लिए है। पैसे प्राप्त करने या कैशबैक के लिए कभी PIN की आवश्यकता नहीं होती।' },
  ta: { rule: 'தங்க விதி:', rest: 'UPI PIN பணம் அனுப்ப மட்டுமே. பணம் பெற அல்லது கேஷ்பேக்கிற்கு PIN தேவையில்லை.' },
  te: { rule: 'బంగారు నియమం:', rest: 'UPI PIN డబ్బు పంపడానికి మాత్రమే. డబ్బు అందుకోవడానికి లేదా క్యాష్‌బ్యాక్ కోసం PIN ఎప్పుడూ అవసరం లేదు.' },
  bn: { rule: 'সোনালী নিয়ম:', rest: 'UPI PIN শুধু টাকা পাঠানোর জন্য। টাকা গ্রহণ বা ক্যাশব্যাকের জন্য কখনো PIN লাগে না।' },
  mr: { rule: 'सुवर्ण नियम:', rest: 'UPI PIN फक्त पैसे पाठवण्यासाठी. पैसे मिळवण्यासाठी किंवा कॅशबॅकसाठी कधीही PIN लागत नाही.' },
};
const CHECK_PAYMENT_LABELS = { en: 'Check payment', hi: 'भुगतान चेक करें', ta: 'பணமதிப்பைச் சரி', te: 'చెల్లిప్పను చెక్ చేయండి', bn: 'পেমেন্ট চেক করুন', mr: 'भुमतणुकी तपासा' };
const CHECKING_PAYMENT_LABELS = { en: 'Checking payment', hi: 'भुगतान जाँच रहा है', ta: 'பணமதிப்பு சரிசார்க்கிறது', te: 'చెల్లిప్పను పరిశీలిస్తుంది', bn: 'পেমেন্ট যাচাই হচ্ছে', mr: 'भुमतणुकी तपासत आहे' };
const TITLE_LABELS = { en: 'Check QR code or UPI ID', hi: 'क्यूआर कोड या यूपीआई आईडी जाँचें', ta: 'QR குறியீடு அல்லது UPI ஐடி தேடு', te: 'QR కోడ్ లేదా UPI ఐడి చెక్ చేయండి', bn: 'কিউআর কোড বা ইউপিআই আইডি যাচাই করুন', mr: 'QR कोड किंवा UPI आयडी तपासा' };
const SUBTITLE_LABELS = { en: 'Paste a UPI deep link or VPA before you pay.', hi: 'भुगतान करने से पहले UPI गहरा लिंक या VPA पेस्ट करें।', ta: 'பணம் செலுத்துவதற்கு முன் UPI deep link அல்லது VPA ஐ ஒட்டவும்.', te: 'చెల్లించే ముందు UPI deep link లేదా VPA పెట్టండి.', bn: 'পেমেন্ট করার আগে একটি UPI ডিপ লিংক বা VPA পেস্ট করুন।', mr: 'पैसे देण्यापूर्वी UPI deep link किंवा VPA पेस्ट करा.' };
const SAMPLE_LABELS = {
  cashback:   { en: 'Fake ₹4,999 cashback trap',     hi: 'फर्जी ₹4,999 कैशबैक जाल',      ta: 'போரேடு ₹4,999 கேஷ்பேக் வலை',       te: 'మోసాల ₹4,999 క్యాష్‌బ్యాక్ ట్రాప్',     bn: 'ভুয়া ₹৪,৯৯৯ ক্যাশব্যাক ফাঁদ',        mr: 'बनावट ₹4,999 कॅशबॅक सापळा' },
  grocery:    { en: 'Legitimate ₹150 grocery store', hi: 'वैध ₹150 किराना दुकान',          ta: 'சரியான ₹150 மளிகை கடை',            te: 'చెల్లుబాటు ₹150 కిరాణా దుకాణం',         bn: 'বৈধ ₹১৫০ মুদির দোকান',                mr: 'वैध ₹150 किराणा दुकान' },
  electricity:{ en: 'Fake electricity officer VPA',   hi: 'फर्जी बिजली अधिकारी VPA',        ta: 'போரேடு மின் அதிகாரி VPA',           te: 'మోసాల విద్యుత్ అధికారి VPA',            bn: 'ভুয়া বিদ্যুৎ কর্মকর্তা VPA',            mr: 'बनावट वीज अधिकारी VPA' },
};

const SAMPLE_QRS = [
  { labelKey: 'cashback',    data: 'upi://pay?pa=cashback-claim@ybl&am=4999&pn=PaytmReward&tn=Claim+Cashback+Reward' },
  { labelKey: 'grocery',    data: 'upi://pay?pa=kirana-store@sbi&am=150&pn=Ramesh+Kirana+Store&tn=Groceries' },
  { labelKey: 'electricity', data: 'upi://pay?pa=electricity-nodal-officer@axl&am=2450&pn=Electricity+Bill+Desk' },
];

export default function QrScanner({ currentLang = 'hi', onOpenReport, onMintBlock, onTriggerMicroFriction, initialPayload = '', onResult }) {
  const [input, setInput] = useState(initialPayload);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    if (initialPayload && initialPayload !== input) setInput(initialPayload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPayload]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const runScan = (data = input) => {
    if (!data.trim()) return;
    setResult(null);
    setIsScanning(true);
    setScanStep(1);
    const steps = SCANNER.steps.qr[currentLang] || SCANNER.steps.qr.en;
    for (let i = 2; i <= steps.length; i++) {
      timers.current.push(setTimeout(() => setScanStep(i), 250 * (i - 1)));
    }
    timers.current.push(setTimeout(() => {
      const res = parseUpiPayload(data);
      setResult(res);
      setIsScanning(false);
      setScanStep(0);
      if (onResult) onResult(res);
      if (res && res.hasDeceptiveIntent && onTriggerMicroFriction) onTriggerMicroFriction(res);
    }, 250 * steps.length + 200));
  };

  return (
    <div className="space-y-4">
      {/* Golden rule */}
      <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)]">
        <AlertTriangle className="w-4 h-4 text-[var(--warning-text)] shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-[var(--text-primary)] leading-relaxed">
          <span className="font-semibold">{t(currentLang, GOLDEN_RULE_LABELS).rule}</span> {t(currentLang, GOLDEN_RULE_LABELS).rest}
        </p>
      </div>

      <section className="panel-elevated p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center shrink-0">
            <QrCode className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{t(currentLang, TITLE_LABELS)}</h2>
            <p className="text-[12.5px] text-[var(--text-muted)]">{t(currentLang, SUBTITLE_LABELS)}</p>
          </div>
        </div>

        <div className="mt-4">
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(currentLang, SCANNER.placeholders.qr)}
            className="input input-textarea"
          />
        </div>

        <div className="mt-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{t(currentLang, SCANNER.examples)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_QRS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInput(s.data); runScan(s.data); }}
                className="text-left p-2.5 rounded-md border border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <p className="text-[12.5px] font-medium text-[var(--text-primary)] leading-tight">{t(currentLang, SAMPLE_LABELS[s.labelKey])}</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 font-mono">{s.data}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <button onClick={() => setInput('')} disabled={!input} className="btn btn-ghost btn-sm">
            <Trash2 className="w-3.5 h-3.5" />{t(currentLang, SCANNER.buttons.clear)}
          </button>
          <button onClick={() => runScan()} disabled={!input.trim() || isScanning} className="btn btn-primary">
            {isScanning ? (<><Loader2 className="w-4 h-4 animate-spin-slow" />{t(currentLang, SCANNER.buttons.analyzing)}</>) : (<><Search className="w-4 h-4" />{t(currentLang, CHECK_PAYMENT_LABELS)}</>)}
          </button>
        </div>
      </section>

      {isScanning && (
        <section className="panel-elevated p-5 animate-fade-in" aria-live="polite">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-3.5 h-3.5 text-[var(--primary)] animate-spin-slow" />
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{t(currentLang, CHECKING_PAYMENT_LABELS)}</h3>
          </div>
          <div className="space-y-0.5">
            {(SCANNER.steps.qr[currentLang] || SCANNER.steps.qr.en).map((label, i) => {
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
