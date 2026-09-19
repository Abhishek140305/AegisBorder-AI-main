import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Lock, Trash2, Search, UserX, UserCheck, Loader2 } from 'lucide-react';
import { analyzeMessage } from '../engine/codeMixedNlp';
import RiskResultCard from './RiskResultCard';
import VoiceAssistant from './VoiceAssistant';
import { SCANNER, HOME, t } from '../engine/regionalDictionary';

const UNKNOWN_NUMBER_LABELS = { en: 'Unknown number', hi: 'अज्ञात नंबर', ta: 'தெரியாத எண்', te: 'తెలియని నంబర్', bn: 'অজানা নম্বর', mr: 'अज्ञात नंबर' };
const SAVED_CONTACT_LABELS = { en: 'Saved contact', hi: 'सहेजा गया संपर्क', ta: 'சேமித்த தொடர்பு', te: 'సేవ్ చేసిన కాంటాక్ట్', bn: 'সংরক্ষিত পরিচিতি', mr: 'जतन केलेला संपर्क' };
const SCAN_MSG_LABELS = { en: 'Scan message', hi: 'संदेश स्कैन करें', ta: 'செய்தியைத் தேடு', te: 'సందేశం స్క్యాన్ చేయండి', bn: 'বার্তা স্ক্যান করুন', mr: 'संदेश स्कॅन करा' };
const ANALYZING_LABELS = { en: 'Analyzing message', hi: 'संदेश का विश्लेषण', ta: 'செய்தி பகுப்பாய்வு', te: 'సందేశం విశ్లేషణ', bn: 'বার্তা বিশ্লেষণ', mr: 'संदेश विश्लेषण' };
const TITLE_LABELS = { en: 'Check a suspicious message', hi: 'संदिग्ध संदेश जाँचें', ta: 'தெளிவான செய்தியைத் தேடு', te: 'సందిగ్ధ సందేశం చెక్ చేయండి', bn: 'সন্দেহজনক বার্তা যাচাই করুন', mr: 'संदिग्ध संदेश तपासा' };
const SUBTITLE_LABELS = { en: 'Paste an SMS or WhatsApp message and we’ll explain whether it looks safe.', hi: 'एसएमएस या व्हाट्सऐप संदेश पेस्ट करें और हम बताएंगे कि यह सुरक्षित है या नहीं।', ta: 'SMS அல்லது WhatsApp செய்தியை ஒட்டவும், அது பாதுகாப்பானதா என்பதை விளக்குவோம்.', te: 'SMS లేదా WhatsApp సందేశాన్ని పెట్టండి, అది సురక్షితమైనదో కాదో మేము వివరిస్తాము.', bn: 'একটি এসএমএস বা ওয়াটসাপ বার্তা পেস্ট করুন এবং এটি নিরাপদ কিনা আমরা ব্যাখ্যা করব।', mr: 'SMS किंवा WhatsApp संदेश येथे पेस्ट करा आणि ते सुरक्षित आहे का ते सांगू.' };
const SAFE_QUESTION_LABELS = { en: 'Is this message safe?', hi: 'क्या यह संदेश सुरक्षित है?', ta: 'இந்த செய்தி பாதுகாப்பானதா?', te: 'ఈ సందేశం సురक్షితమైనదా?', bn: 'এই বার্তাটি কি নিরাপদ?', mr: 'हा संदेश सुरक्षित आहे का?' };
const SAFE_ANSWER_LABELS = { en: 'Paste any SMS or WhatsApp message above. Rakshak AI will tell you in plain language whether it is safe, suspicious, or a scam — and what to do next.', hi: 'ऊपर कोई एसएमएस या व्हाट्सऐप संदेश पेस्ट करें। रक्षक AI सरल भाषा में बताएगा कि यह सुरक्षित है, संदिग्ध है, या धोखाधड़ी है — और आगे क्या करें।', ta: 'மேலே ஏதாவது SMS அல்லது WhatsApp செய்தியை ஒட்டவும். ரக்ஷக் AI அது பாதுகாப்பானதா, சந்தேகமா அல்லது கற்றமா என்பதை எளிய மொழியில் சொல்லும் — அடுத்து என்ன செய்ய வேண்டும்.', te: 'పైన ఏదైనా SMS లేదా WhatsApp సందేశాన్ని పెట్టండి. రక్షక్ AI అది సురక్షితమైనదో, అనుమానమైనదో లేదా మోసమో సరళమైన భాషలో చెప్తుంది — తరువాత ఏమి చేయాలి.', bn: 'উপরে যেকোনো এসএমএস বা ওয়াটসাপ বার্তা পেস্ট করুন। রাকশাক AI সাধারণ ভাষায় বলবে এটি নিরাপদ, সন্দেহজনক, নাকি স্ক্যাম — এবং পরবর্তীতে কী করবেন।', mr: 'वर कोणताही SMS किंवा WhatsApp संदेश पेस्ट करा. रक्षक AI सोप्या भाषेत सांगेल की हा संदेश सुरक्षित आहे, संदिग्ध आहे, किंवा शक्य आहे — आणि पुढे काय करायचे.' };

const SAMPLE_MESSAGES = [
  {
    titleKey: 'electricity',
    text:
      'Dear customer aapka bijli bill update nahi hai, aaj raat 9 baje connection cut jayega. Pay ₹20 immediately using this link electricity-nodal-officer.in/pay',
    known: false,
  },
  {
    titleKey: 'kyc',
    text:
      'Dear SBI User, your YONO NetBanking will be blocked today due to pending KYC update. Click http://sbi-bank-kyc-update.top to reactivate account.',
    known: false,
  },
  {
    titleKey: 'photo',
    title: { en: 'Friend’s Photo Link', hi: 'मित्र की फोटो लिंक', ta: 'நண்பரின் புகைப்பட இணைப்பு', te: 'స్నేహితుని ఫోటో లింక్', bn: 'বন্ধুর ফটো লিংক', mr: 'मित्राचा फोटो दुवा' },
    text: 'Hey, check this photo link http://trip-photos-share.top from yesterday’s family picnic!',
    known: true,
  },
];

export default function MessageScanner({
  currentLang = 'hi',
  onOpenReport,
  onMintBlock,
  initialText = '',
  onResult,
}) {
  const [inputText, setInputText] = useState(initialText);
  const [isKnownContact, setIsKnownContact] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState(null);
  const stepTimers = useRef([]);

  useEffect(() => {
    if (initialText && initialText !== inputText) setInputText(initialText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);

  useEffect(() => () => stepTimers.current.forEach(clearTimeout), []);

  const runScan = (text = inputText, known = isKnownContact) => {
    if (!text.trim()) return;
    setResult(null);
    setIsScanning(true);
    setScanStep(1);

    const steps = SCANNER.steps.message[currentLang] || SCANNER.steps.message.en;
    for (let i = 2; i <= steps.length; i++) {
      const t = setTimeout(() => setScanStep(i), 250 * (i - 1));
      stepTimers.current.push(t);
    }

    const final = setTimeout(() => {
      const res = analyzeMessage(text, currentLang, {
        isKnownContact: known,
        senderInfo: known ? t(currentLang, SAVED_CONTACT_LABELS) : t(currentLang, UNKNOWN_NUMBER_LABELS),
      });
      setResult(res);
      setIsScanning(false);
      setScanStep(0);
      if (onResult) onResult(res);
    }, 250 * steps.length + 200);
    stepTimers.current.push(final);
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Main scanner panel */}
      <section className="panel-elevated">
        <div className="p-5 sm:p-6">
          {/* Title row */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{t(currentLang, TITLE_LABELS)}</h2>
                <p className="text-[12.5px] text-[var(--text-muted)]">
                  {t(currentLang, SUBTITLE_LABELS)}
                </p>
              </div>
            </div>
            <VoiceAssistant
              currentLang={currentLang}
              onVoiceInput={(spoken) => { setInputText(spoken); runScan(spoken, isKnownContact); }}
            />
          </div>

          {/* Sender toggle */}
          <div className="mt-4 flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] w-full sm:w-fit">
            <button
              onClick={() => setIsKnownContact(false)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-medium transition-colors ${
                !isKnownContact
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-medium)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              {t(currentLang, UNKNOWN_NUMBER_LABELS)}
            </button>
            <button
              onClick={() => setIsKnownContact(true)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-medium transition-colors ${
                isKnownContact
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-medium)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {t(currentLang, SAVED_CONTACT_LABELS)}
            </button>
          </div>

          {/* Textarea */}
          <div className="mt-4 relative">
            <textarea
              rows={5}
              maxLength={2000}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t(currentLang, SCANNER.placeholders.message)}
              className="input input-textarea"
            />
            <div className="absolute bottom-2 right-3 text-[11px] text-[var(--text-muted)] tabular-nums pointer-events-none">
              {inputText.length} / 2000
            </div>
          </div>

          {/* Examples */}
          <div className="mt-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{t(currentLang, SCANNER.examples)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_MESSAGES.map((s, i) => {
                const title = s.titleKey
                  ? t(currentLang, HOME.commonScams[s.titleKey]?.title)
                  : s.title
                    ? t(currentLang, s.title)
                    : s.title;
                return (
                <button
                  key={i}
                  onClick={() => { setInputText(s.text); setIsKnownContact(s.known); runScan(s.text, s.known); }}
                  className="text-left p-2.5 rounded-md border border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <p className="text-[12.5px] font-medium text-[var(--text-primary)] leading-tight">{title}</p>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5">{s.text}</p>
                </button>
              );})}
            </div>
          </div>

          {/* Privacy note */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <p className="text-[11.5px] text-[var(--text-muted)]">
              {t(currentLang, SCANNER.privacyNote)}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              onClick={handleClear}
              disabled={!inputText}
              className="btn btn-ghost btn-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t(currentLang, SCANNER.buttons.clear)}
            </button>

            <button
              onClick={() => runScan()}
              disabled={!inputText.trim() || isScanning}
              className="btn btn-primary"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin-slow" />
                  {t(currentLang, SCANNER.buttons.analyzing)}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  {t(currentLang, SCAN_MSG_LABELS)}
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Scanning state */}
      {isScanning && (
        <section className="panel-elevated p-5 animate-fade-in" aria-live="polite">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-3.5 h-3.5 text-[var(--primary)] animate-spin-slow" />
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{t(currentLang, ANALYZING_LABELS)}</h3>
          </div>
          <div className="space-y-0.5">
            {SCANNER.steps.message[currentLang]?.map((label, i) => {
              const stepNum = i + 1;
              const done = scanStep > stepNum;
              const active = scanStep === stepNum;
              return (
                <div
                  key={label}
                  className={`scan-step ${done ? 'done' : active ? 'active' : ''}`}
                >
                  <span className="step-icon">
                    {done ? '✓' : active ? '' : ''}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Result */}
      {result && !isScanning && (
        <RiskResultCard
          result={result}
          currentLang={currentLang}
          onOpenReport={onOpenReport}
          onMintBlock={onMintBlock}
        />
      )}

      {/* Empty state */}
      {!result && !isScanning && (
        <section className="panel p-5">
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">{t(currentLang, SAFE_QUESTION_LABELS)}</h3>
          <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
            {t(currentLang, SAFE_ANSWER_LABELS)}
          </p>
        </section>
      )}
    </div>
  );
}
