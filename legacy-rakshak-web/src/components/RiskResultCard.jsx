import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Volume2,
  FileText,
  CheckCircle2,
  XCircle,
  Info,
  Hash,
} from 'lucide-react';
import { speakText } from './VoiceAssistant';
import { t } from '../engine/regionalDictionary';

const RISK_SCORE_LABELS = { en: 'Risk score', hi: 'जोखिम स्कोर', ta: 'இடர் மதிப்பெண்', te: 'రిస్క్ స్కోర్', bn: 'ঝুঁকি স্কোর', mr: 'जोखीम स्कोअर' };
const VERDICT_SAFE_LABELS = { en: 'Looks safe', hi: 'सुरक्षित लगता है', ta: 'பாதுகாப்பானதாகத் தெரிகிறது', te: 'సురక్షితంగా కనిపిస్తుంది', bn: 'নিরাপদ মনে হচ্ছে', mr: 'सुरक्षित दिसते' };
const VERDICT_DANGER_LABELS = { en: 'High risk', hi: 'उच्च जोखिम', ta: 'உயர் இடர்', te: 'అధిక ప్రమాదం', bn: 'উচ্চ ঝুঁকি', mr: 'उच्च जोखीम' };
const VERDICT_CAUTION_LABELS = { en: 'Be careful', hi: 'सावधान रहें', ta: 'கவனமாக இருங்கள்', te: 'జాగ్రత్తగా ఉండండి', bn: 'সতর্ক থাকুন', mr: 'सावधान रहा' };
const VERDICT_SUB_SAFE_LABELS = { en: 'Rakshak AI did not find strong scam indicators.', hi: 'रक्षक AI ने कोई मजबूत धोखाधड़ी संकेतक नहीं पाए।', ta: 'ரக்ஷக் AI வலுவான கற்றக குறிப்பான்களைக் கண்டறியவில்லை.', te: 'రక్షక్ AI బలమైన స్కామ్ సూచనలను కనుగొనలేదు.', bn: 'রাকশাক AI কোনো শক্তিশালী স্ক্যাম ইন্ডিকেটর খুঁজে পায়নি।', mr: 'रक्षक AI ने कोणतेही मजबूत शक्य निर्देशक सापडले नाहीत.' };
const VERDICT_SUB_DANGER_LABELS = { en: 'Strong scam indicators detected. Avoid interacting.', hi: 'मजबूत धोखाधड़ी संकेतक मिले। बातचीत से बचें।', ta: 'வலுவான கற்றக குறிப்பான்கள் கண்டறியப்பட்டன. தவிர்க்கவும்.', te: 'బలమైన స్కామ్ సూచనలు గుర్తించబడ్డాయి. పరస్పర చర్యను నివారించండి.', bn: 'শক্তিশালী স্ক্যাম ইন্ডিকেটর শনাক্ত করা হয়েছে। এড়িয়ে চলুন।', mr: 'मजबूत शक्य संकेतक आढळले. संवाद टाळा.' };
const VERDICT_SUB_CAUTION_LABELS = { en: 'Some suspicious indicators were detected.', hi: 'कुछ संदिग्ध संकेतक मिले।', ta: 'சில சந்தேகமான குறிப்பான்கள் கண்டறியப்பட்டன.', te: 'కొన్ని అనుమానిత సూచనలు గుర్తించబడ్డాయి.', bn: 'কিছু সন্দেহজনক ইন্ডিকেটর শনাক্ত করা হয়েছে।', mr: 'काही संशयी संकेतक आढळले.' };
const WHY_FLAGGED_LABELS = { en: 'Why we flagged it', hi: 'हमने इसे क्यों चिह्नित किया', ta: 'நாம் ஏன் குறிப்பிட்டோம்', te: 'మేము ఎందుకు ఫ్లాగ్ చేశాము', bn: 'আমরা কেন এটি চিহ্নিত করেছি', mr: 'आम्ही का फ्लॅग केले' };
const WHAT_NOTICED_LABELS = { en: 'What we noticed', hi: 'हमने क्या देखा', ta: 'நாம் என்ன கவனித்தோம்', te: 'మేము ఏమి గమనించాము', bn: 'আমরা কী লক্ষ্য করেছি', mr: 'आम्ही काय पाहिले' };
const DETECTED_SIGNALS_LABELS = { en: 'Detected signals', hi: 'पाए गए संकेत', ta: 'கண்டறியப்பட்ட சமிக்ஞைகள்', te: 'గుర్తించబడ్డ సంకేతాలు', bn: 'সনাক্ত সংকেত', mr: 'आढळलेले संकेत' };
const WHAT_TO_DO_LABELS = { en: 'What to do next', hi: 'अगला क्या करें', ta: 'அடுத்து என்ன செய்ய வேண்டும்', te: 'తరువాత ఏమి చేయాలి', bn: 'পরবর্তীতে কী করবেন', mr: 'पुढे काय करायचे' };
const LISTEN_LABELS = { en: 'Listen', hi: 'सुनें', ta: 'கேளுங்கள்', te: 'వినండి', bn: 'শুনুন', mr: 'ऐका' };
const REPORT_SCAM_LABELS = { en: 'Report scam', hi: 'धोखाधड़ी रिपोर्ट करें', ta: 'கற்றத்தை அறிவியல்', te: 'స్కామ్ నమోదు చేయండి', bn: 'স্ক্যাম রিপোর্ট করুন', mr: 'शक्य कचवा' };
const BLOCK_LABELS = { en: 'Block', hi: 'ब्लॉक करें', ta: 'தடுக்கவும்', te: 'నిరోధించండి', bn: 'ব্লক করুন', mr: 'अडकला' };
const NO_SCAM_LABELS = { en: 'No scam patterns detected', hi: 'कोई धोखाधड़ी पैटर्न नहीं मिला', ta: 'கற்றக மாதிரிகள் கண்டறியப்படவில்லை', te: 'స్కామ్ మార్గాలు గుర్తించబడలేదు', bn: 'কোনো স্ক্যাম প্যাটার্ন শনাক্ত হয়নি', mr: 'कोणतेही शक्य पॅटर्न आढळले नाहीत' };
const SUSPICIOUS_LABELS = { en: 'Suspicious message', hi: 'संदिग्ध संदेश', ta: 'தெளிவான செய்தி', te: 'సందిగ్ధ సందేశం', bn: 'সন্দেহজনক বার্তা', mr: 'संदिग्ध संदेश' };

/* ============================================================
   Animated risk score bar (0 → target over 600ms)
   ============================================================ */
function RiskScoreBar({ targetScore, currentLang }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 600;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * targetScore));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetScore]);

  const isSafe = targetScore < 40;
  const isCritical = targetScore >= 75;
  const color = isSafe ? 'var(--success)' : isCritical ? 'var(--danger)' : 'var(--warning)';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t(currentLang, RISK_SCORE_LABELS)}</span>
        <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{displayed}/100</span>
      </div>
      <div className="risk-bar-track">
        <div className="risk-bar-fill" style={{ width: `${displayed}%`, background: color }} />
      </div>
    </div>
  );
}

/* ============================================================
   Map engine severities → our 3-state model
   ============================================================ */
function normalizeSeverity(result) {
  if (!result) return 'safe';
  if (result.severity === 'SAFE' || result.status === 'SAFE' || (result.riskScore ?? 0) < 40) return 'safe';
  if (result.severity === 'CRITICAL' || (result.riskScore ?? 0) >= 75) return 'danger';
  return 'caution';
}

/* ============================================================
   Result card
   ============================================================ */
export default function RiskResultCard({
  result,
  currentLang = 'hi',
  onOpenReport,
  onMintBlock,
}) {
  if (!result) return null;

  const state = normalizeSeverity(result);
  const isSafe = state === 'safe';
  const isCaution = state === 'caution';
  const isDanger = state === 'danger';

  const verdictText = isSafe
    ? t(currentLang, VERDICT_SAFE_LABELS)
    : isDanger
    ? t(currentLang, VERDICT_DANGER_LABELS)
    : t(currentLang, VERDICT_CAUTION_LABELS);

  const verdictSub = isSafe
    ? t(currentLang, VERDICT_SUB_SAFE_LABELS)
    : isDanger
    ? t(currentLang, VERDICT_SUB_DANGER_LABELS)
    : t(currentLang, VERDICT_SUB_CAUTION_LABELS);

  const palette = isSafe
    ? { border: 'var(--success-border)', bg: 'var(--success-bg)', text: 'var(--success-text)', solid: 'var(--success)' }
    : isCaution
    ? { border: 'var(--warning-border)', bg: 'var(--warning-bg)', text: 'var(--warning-text)', solid: 'var(--warning)' }
    : { border: 'var(--danger-border)', bg: 'var(--danger-bg)', text: 'var(--danger-text)', solid: 'var(--danger)' };

  const StatusIcon = isSafe ? ShieldCheck : isDanger ? ShieldAlert : AlertTriangle;
  const StatusTextIcon = isSafe ? CheckCircle2 : isDanger ? XCircle : Info;

  /* Reasons list (from matches if present) */
  const reasons = (() => {
    if (result.reasons && result.reasons.length) return result.reasons;
    if (result.matches && result.matches.length) {
      return result.matches.flatMap(m => m.matchedKeywords || []).slice(0, 6);
    }
    if (isDanger) {
      return [
        t(currentLang, { en: 'Creates urgency or fear', hi: 'जल्दबाजी या डर पैदा करता है', ta: 'அவசரம் அல்லது பயத்தை உருவாக்குகிறது', te: 'అత్యవసరత లేదా భయాన్ని సృష్టిస్తుంది', bn: 'জরুরি অবস্থা বা ভয় তৈরি করে', mr: 'तातडी किंवा भीती निर्माण करते' }),
        t(currentLang, { en: 'Requests money or sensitive information', hi: 'पैसे या संवेदनशील जानकारी माँगता है', ta: 'பணம் அல்லது முக்கியமான தகவலைக் கோருகிறது', te: 'డబ్బు లేదా సున్నితమైన సమాచారాన్ని అభ్యర్థిస్తుంది', bn: 'টাকা বা সংবেদনশীল তথ্য চায়', mr: 'पैसे किंवा संवेदनशील माहितीची विनंती करते' }),
        t(currentLang, { en: 'Contains a suspicious link', hi: 'संदिग्ध लिंक है', ta: 'தெளிவான இணைப்பு உள்ளது', te: 'సందిగ్ధ లింక్ ఉంది', bn: 'সন্দেহজনক লিংক রয়েছে', mr: 'संदिग्ध दुवा आहे' }),
        t(currentLang, { en: 'Uses KYC / account-threat language', hi: 'KYC / खाता-धमकी भाषा का उपयोग करता है', ta: 'KYC / கணக்கு-மிரட்டல் மொழியைப் பயன்படுத்துகிறது', te: 'KYC / ఖాతా-బెదిరింపు భాషను ఉపయోగిస్తుంది', bn: 'KYC / অ্যাকাউন্ট-হুমকির ভাষা ব্যবহার করে', mr: 'KYC / खाते-धमकी भाषा वापरते' }),
      ];
    }
    if (isCaution) {
      return [
        t(currentLang, { en: 'Contains an unfamiliar link', hi: 'अपरिचित लिंक है', ta: 'அறிமுகமில்லாத இணைப்பு உள்ளது', te: 'తెలియని లింక్ ఉంది', bn: 'অপরিচিত লিংক রয়েছে', mr: 'अपरिचित दुवा आहे' }),
        t(currentLang, { en: 'Asks for personal or financial information', hi: 'व्यक्तिगत या वित्तीय जानकारी माँगता है', ta: 'தனிப்பட்ட அல்லது நிதி தகவலைக் கோருகிறது', te: 'వ్యక్తిగత లేదా ఆర్థిక సమాచారాన్ని అభ్యర్థిస్తుంది', bn: 'ব্যক্তিগত বা আর্থিক তথ্য চায়', mr: 'वैयक्तिक किंवा आर्थिक माहितीची विनंती करते' }),
        t(currentLang, { en: 'Tone suggests urgency', hi: 'लहजा जल्दबाजी का संकेत देता है', ta: 'தொனி அவசரத்தைக் குறிக்கிறது', te: 'స్వరం అత్యవసరాన్ని సూచిస్తుంది', bn: 'সুর জরুরি অবস্থা বোঝায়', mr: 'सूर तातडीचा संकेत देतो' }),
      ];
    }
    return [];
  })();

  /* Detected signals (chips) */
  const signals = (() => {
    if (result.signals && result.signals.length) return result.signals;
    if (result.matches && result.matches.length) {
      const seen = new Set();
      return result.matches
        .map(m => (m.category || '').replace(/_/g, ' ').toLowerCase())
        .filter(s => s && !seen.has(s) && seen.add(s))
        .slice(0, 4);
    }
    if (isDanger) {
      return [
        t(currentLang, { en: 'Urgency', hi: 'जल्दबाजी', ta: 'அவசரம்', te: 'అత్యవసరత', bn: 'জরুরি', mr: 'तातडी' }),
        t(currentLang, { en: 'Payment request', hi: 'भुगतान अनुरोध', ta: 'பணம் கோரிக்கை', te: 'చెల్లింపు అభ్యర్థన', bn: 'পেমেন্ট অনুরোধ', mr: 'भुमतणुकी विनंती' }),
        t(currentLang, { en: 'Suspicious URL', hi: 'संदिग्ध URL', ta: 'தெளிவான URL', te: 'సందిగ్ధ URL', bn: 'সন্দেহজনক URL', mr: 'संदिग्ध URL' }),
        t(currentLang, { en: 'Impersonation', hi: 'प्रतिरूपण', ta: 'போலி', te: 'మోసం', bn: 'ছদ্মবেশ', mr: 'बनावट' }),
      ];
    }
    if (isCaution) return [
      t(currentLang, { en: 'Suspicious link', hi: 'संदिग्ध लिंक', ta: 'தெளிவான இணைப்பு', te: 'సందిగ్ధ లింక్', bn: 'সন্দেহজনক লিংক', mr: 'संदिग्ध दुवा' }),
      t(currentLang, { en: 'Urgency tone', hi: 'जल्दबाजी का लहजा', ta: 'அவசரத் தொனி', te: 'అత్యవసర స్వరం', bn: 'জরুরি সুর', mr: 'तातडीचा सूर' }),
    ];
    return [];
  })();

  const explanationText = typeof result.explanation === 'object'
    ? (result.explanation[currentLang] || result.explanation.en)
    : (result.explanation || '');

  const recommendationText = typeof result.recommendation === 'object'
    ? (result.recommendation[currentLang] || result.recommendation.en)
    : (result.recommendation || '');

  const handleSpeak = () => {
    let txt = result.title ? result.title + '. ' : '';
    if (explanationText) txt += explanationText + '. ';
    if (recommendationText) txt += recommendationText;
    speakText(txt, currentLang);
  };

  return (
    <section
      className="panel-elevated overflow-hidden animate-slide-up"
      style={{ borderColor: palette.border }}
    >
      {/* Status header */}
      <div className="px-5 pt-5 pb-4" style={{ background: palette.bg }}>
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-surface)', border: `1px solid ${palette.border}` }}
          >
            <StatusIcon
              className={`w-5 h-5 ${isSafe ? 'animate-check-pop' : 'animate-attention'}`}
              style={{ color: palette.solid }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge" style={{ background: 'var(--bg-surface)', color: palette.text, borderColor: palette.border }}>
                {verdictText}
              </span>
              {!isSafe && result.severity && (
                <span className="badge badge-neutral">{result.severity}</span>
              )}
            </div>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug">
              {result.title || (isSafe ? t(currentLang, NO_SCAM_LABELS) : t(currentLang, SUSPICIOUS_LABELS))}
            </h3>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{verdictSub}</p>
          </div>
        </div>

        <div className="mt-4">
          <RiskScoreBar targetScore={result.riskScore ?? 0} currentLang={currentLang} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-5">
        {explanationText && (
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              {t(currentLang, WHY_FLAGGED_LABELS)}
            </h4>
            <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed">
              {explanationText}
            </p>
          </div>
        )}

        {reasons.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              {t(currentLang, WHAT_NOTICED_LABELS)}
            </h4>
            <ul className="space-y-1.5">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ background: palette.bg, color: palette.text, border: `1px solid ${palette.border}` }}
                  >
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {signals.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              {t(currentLang, DETECTED_SIGNALS_LABELS)}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {signals.map((s, i) => (
                <span key={i} className="chip capitalize">
                  <Hash className="w-3 h-3" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {recommendationText && (
          <div
            className="rounded-lg p-3.5"
            style={{ background: palette.bg, border: `1px solid ${palette.border}` }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <StatusTextIcon className="w-3.5 h-3.5" style={{ color: palette.text }} />
              <h4 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: palette.text }}>
                {t(currentLang, WHAT_TO_DO_LABELS)}
              </h4>
            </div>
            <p className="text-[13.5px] text-[var(--text-primary)] font-medium leading-relaxed">
              {recommendationText}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 pt-1 flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)]">
        <button onClick={handleSpeak} className="btn btn-secondary btn-sm">
          <Volume2 className="w-3.5 h-3.5" />
          {t(currentLang, LISTEN_LABELS)}
        </button>

        {!isSafe && onOpenReport && (
          <button onClick={() => onOpenReport(result)} className="btn btn-danger btn-sm">
            <FileText className="w-3.5 h-3.5" />
            {t(currentLang, REPORT_SCAM_LABELS)}
          </button>
        )}

        {!isSafe && onMintBlock && (
          <button onClick={() => onMintBlock(result)} className="btn btn-secondary btn-sm">
            {t(currentLang, BLOCK_LABELS)}
          </button>
        )}
      </div>
    </section>
  );
}
