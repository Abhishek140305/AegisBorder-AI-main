import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Shield } from 'lucide-react';
import { useT } from '../i18n';

const EXAMPLE_QUESTIONS = {
  en: ['How do I scan a message?', 'Check a website link', 'Is this QR code UPI safe?', 'Verify an APK/app', 'Search the scam registry', 'Screen a passport document', 'Turn on voice alerts'],
  hi: ['मैं संदेश कैसे स्कैन करूँ?', 'वेबसाइट लिंक जाँचें', 'क्या यह QR/UPI सुरक्षित है?', 'APK/ऐप जाँचें', 'स्कैम रजिस्ट्री में खोजें', 'पासपोर्ट दस्तावेज़ जाँचें', 'वॉइस अलर्ट चालू करें'],
};

const INTENTS = [
  {
    id: 'message',
    kw: ['message', 'sms', 'whatsapp', 'text', 'scan message', 'inbox', 'संदेश', 'message scan', 'scam message'],
    en: 'Message Scanner: Go to New Screening → Message Scanner, paste the SMS/WhatsApp text in the box and tap Scan. It checks on-device for phishing lures, OTP fraud and social-engineering patterns and shows a bloom-filter blacklist match when a link is known-bad.',
    hi: 'संदेश स्कैनर: नई जाँच → संदेश स्कैनर पर जाएँ, SMS/WhatsApp टेक्स्ट बॉक्स में चिपकाएँ और स्कैन दबाएँ। यह फ़िशिंग लालच, OTP धोखाधड़ी और सोशल-इंजीनियरिंग पैटर्न की जाँच करता है और ज्ञात-खतरनाक लिंक पर ब्लूम-फ़िल्टर ब्लैकलिस्ट मैच दिखाता है।',
  },
  {
    id: 'website',
    kw: ['website', 'link', 'url', 'domain', 'phishing', 'click', 'site', 'web', 'वेबसाइट', 'लिंक', 'फ़िशिंग'],
    en: 'Website Checker: go to New Screening → Website Checker, paste the domain or URL and press Check. It detects typosquatted, homograph (punycode) and blacklisted phishing domains before you click.',
    hi: 'वेबसाइट जाँचक: नई जाँच → वेबसाइट जाँचक पर जाएँ, डोमेन या URL चिपकाएँ और जाँच दबाएँ। यह क्लिक करने से पहले टाइपोस्क्वेटेड, होमोग्राफ (punycode) और ब्लैकलिस्टेड फ़िशिंग डोमेन पहचानता है।',
  },
  {
    id: 'qr-upi',
    kw: ['qr', 'upi', 'vpa', 'payment', 'pay', 'refund', 'cashback', 'upi://', 'qr code'],
    en: 'QR & UPI Safety: New Screening → QR & UPI Safety, paste the upi://pay deep-link or a VPA. It inspects the payee against the on-device fraud registry and flags cashback/refund lure patterns.',
    hi: 'QR और UPI सुरक्षा: नई जाँच → QR और UPI सुरक्षा, upi://pay डीप-लिंक या VPA चिपकाएँ। यह प्राप्तकर्ता की ऑन-डिवाइस धोखाधड़ी रजिस्ट्री में जाँच करता है और कैशबैक/रिफंड लालच पैटर्न चिह्नित करता है।',
  },
  {
    id: 'app',
    kw: ['apk', 'app', 'android', 'malware', 'permission', 'package', 'trojan', 'ऐप'],
    en: 'App Safety: New Screening → App Safety, enter a package name or a .apk download link. It compares against known malware signature DBs and flags dangerous permissions.',
    hi: 'ऐप सुरक्षा: नई जाँच → ऐप सुरक्षा, पैकेज नाम या .apk डाउनलोड लिंक डालें। यह ज्ञात मैलवेयर सिग्नेचर से तुलना करता है और खतरनाक अनुमतियाँ चिह्नित करता है।',
  },
  {
    id: 'registry',
    kw: ['registry', 'scam registry', 'search phone', 'search number', 'phone', 'number', 'lookup', 'रजिस्ट्री', 'फ़ोन'],
    en: 'Scam Registry: New Screening → Scam Registry, enter a phone number, domain, VPA or app package. It searches the on-device fraud registry and returns known matches with evidence.',
    hi: 'स्कैम रजिस्ट्री: नई जाँच → स्कैम रजिस्ट्री, फ़ोन नंबर, डोमेन, VPA या ऐप पैकेज डालें। यह ऑन-डिवाइस धोखाधड़ी रजिस्ट्री में खोजकर साक्ष्य सहित ज्ञात मैच लौटाता है।',
  },
  {
    id: 'ai-analysis',
    kw: ['ai analysis', 'ai', 'conversation', 'email', 'document', 'upload', 'analyze text', 'एआई'],
    en: 'AI Threat Analysis: New Screening → AI Threat Analysis, paste a conversation, email or document text. The backend analyzes it for threat patterns and returns a risk tier with evidence and recommended action. Requires the backend to be online.',
    hi: 'एआई ख़तरा विश्लेषण: नई जाँच → एआई ख़तरा विश्लेषण, बातचीत, ईमेल या दस्तावेज़ टेक्स्ट चिपकाएँ। बैकएंड ख़तरे के पैटर्न का विश्लेषण कर जोखिम स्तर, साक्ष्य और अनुशंसित कार्रवाई देता है। बैकएंड ऑनलाइन होना ज़रूरी है।',
  },
  {
    id: 'document',
    kw: ['document', 'passport', 'mrz', 'identity', 'screening', 'board', 'viz', 'kepti', 'पासपोर्ट', 'दस्तावेज़', 'पहचान'],
    en: 'Document & Identity Screening: New Screening → Document & Identity Screening. Pick a built-in test scenario, register a passenger, or upload a real document scan. It runs MRZ parsing, OCR, face-liveness, tamper forensics and watchlist checks via the backend.',
    hi: 'दस्तावेज़ और पहचान जाँच: नई जाँच → दस्तावेज़ और पहचान जाँच। बिल्ट-इन परीक्षण परिदृश्य चुनें, यात्री दर्ज करें, या वास्तविक दस्तावेज़ स्कैन अपलोड करें। यह बैकएंड से MRZ पार्सिंग, OCR, चेहरा-लाइवनेस, टैम्पर फोरेंसिक और वॉचलिस्ट जाँच करता है।',
  },
  {
    id: 'forensics',
    kw: ['forensic', 'tamper', 'photo', 'ela', 'metadata', 'photoshop', 'edited', 'फोरेंसिक', 'टैम्पर'],
    en: 'Tamper & Photo Forensics: run a screening, then open the Analysis step and press View technical forensics detail. It shows ELA score, noise discrepancy, splicing regions and any editing software traces.',
    hi: 'टैम्पर और फोटो फोरेंसिक: स्क्रीनिंग चलाएँ, फिर विश्लेषण चरण खोलें और तकनीकी फोरेंसिक विवरण देखें दबाएँ। यह ELA स्कोर, नॉइज़ विसंगति, स्प्लिसिंग क्षेत्र और संपादन सॉफ़्टवेयर निशान दिखाता है।',
  },
  {
    id: 'face',
    kw: ['face', 'biometric', 'liveness', 'camera', 'capture', 'photo', 'match', 'चेहरा', 'लाइवनेस'],
    en: 'Face Verification & Liveness: during a screening, capture the live passenger with the camera or upload a photo. The Face analysis step shows match score, liveness, anti-spoofing and presentation-attack results.',
    hi: 'चेहरा सत्यापन और लाइवनेस: स्क्रीनिंग के दौरान कैमरे से लाइव यात्री कैप्चर करें या फोटो अपलोड करें। चेहरा विश्लेषण चरण में मिलान स्कोर, लाइवनेस, एंटी-स्पूफिंग और प्रेजेंटेशन-अटैक परिणाम दिखते हैं।',
  },
  {
    id: 'watchlist',
    kw: ['watchlist', 'flagged', 'risk', 'decision', 'red flag', 'rfm', 'वॉचलिस्ट', 'फ़्लैग'],
    en: 'Watchlist & Risk Decision: the Result step of a screening shows the composite risk score, watchlist hits, risk factors and the recommended decision (grant, secondary inspection, or detain).',
    hi: 'वॉचलिस्ट और जोखिम निर्णय: स्क्रीनिंग का परिणाम चरण समग्र जोखिम स्कोर, वॉचलिस्ट हिट, जोखिम कारक और अनुशंसित निर्णय (प्रवेश, द्वितीयक निरीक्षण, या हिरासत) दिखाता है।',
  },
  {
    id: 'audit',
    kw: ['audit', 'certificate', 'certification', 'report', 'ledger', 'signature', 'ऑडिट', 'रिपोर्ट'],
    en: 'Audit Certification: from the Result step, press the Audit report button. It opens the signed audit certificate for the case, which is also logged in Screening History.',
    hi: 'ऑडिट प्रमाणन: परिणाम चरण से ऑडिट रिपोर्ट बटन दबाएँ। यह मामले का हस्ताक्षरित ऑडिट प्रमाणपत्र खोलता है, जो जाँच इतिहास में भी दर्ज होता है।',
  },
  {
    id: 'voice',
    kw: ['voice', 'alert', 'audio', 'sound', 'speak', 'announce', 'वॉइस', 'आवाज़'],
    en: 'Voice alerts: every threat-check result has a Voice alert on/off toggle in its header. Voice announces HIGH and CRITICAL risk results automatically. Your choice is remembered on this device.',
    hi: 'वॉइस अलर्ट: हर ख़तरा-जाँच परिणाम के हेडर में वॉइस अलर्ट चालू/बंद टॉगल है। HIGH और CRITICAL जोखिम परिणाम अपने आप वॉइस से घोषित होते हैं। आपकी पसंद इसी डिवाइस पर याद रहती है।',
  },
  {
    id: 'language',
    kw: ['language', 'hindi', 'translate', 'translation', 'english', 'regional', 'भाषा', 'हिंदी'],
    en: 'Language: tap the globe icon in the top bar of any screen to switch among English, Hindi and all 22 Scheduled Languages of India. Strings that are not yet translated show in English.',
    hi: 'भाषा: किसी भी स्क्रीन के ऊपरी बार में ग्लोब आइकन दबाएँ और English, हिन्दी और भारत की सभी 22 अनुसूचित भाषाओं में से चुनें। जो स्ट्रिंग अभी अनुवादित नहीं हैं वे English में दिखती हैं।',
  },
  {
    id: 'history',
    kw: ['history', 'past', 'previous', 'reports', 'analytics', 'saved', 'इतिहास', 'रिपोर्ट'],
    en: 'History & Reports: the Screening History, Alerts, Analytics and Reports pages (in the left menu) show the current session’s real screening results, generated alerts and summaries.',
    hi: 'इतिहास और रिपोर्ट: जाँच इतिहास, सतर्कता, विश्लेषण और रिपोर्ट पृष्ठ (बाएँ मेनू में) वर्तमान सत्र के वास्तविक जाँच परिणाम, जनरेटेड सतर्कताएँ और सारांश दिखाते हैं।',
  },
];

function hardcodedAnswer(langAttr, intent) {
  return langAttr === 'hi' ? intent.hi : intent.en;
}

function match(query) {
  const q = query.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const it of INTENTS) {
    let score = 0;
    for (const kw of it.kw) if (q.includes(kw.toLowerCase())) score += kw.length > 4 ? 2 : 1;
    if (score > bestScore) { bestScore = score; best = it; }
  }
  return bestScore > 0 ? best : null;
}

export default function GuideChat() {
  const { lang } = useT();
  const langAttr = lang === 'hi' ? 'hi' : 'en';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  const push = useCallback((who, text) => {
    setMessages((m) => [...m, { who, text }]);
  }, []);

  const ask = useCallback((raw) => {
    const text = (raw || input).trim();
    if (!text) return;
    push('user', text);
    setInput('');
    const intent = match(text);
    if (intent) {
      push('bot', hardcodedAnswer(langAttr, intent));
    } else if (/^(no|nothing|exit|bye|thanks|thank)/i.test(text)) {
      push('bot', 'Thank you. AegisBorder AI is ready whenever you are.' + (langAttr === 'hi' ? ' धन्यवाद!' : ''));
    } else {
      push('bot', langAttr === 'hi'
        ? 'मुझे समझ नहीं आया। मैं इन चीज़ों में मदद कर सकता हूँ: संदेश स्कैन, वेबसाइट/लिंक जाँच, QR/UPI सुरक्षा, ऐप सत्यापन, स्कैम रजिस्ट्री, दस्तावेज़/पासपोर्ट स्क्रीनिंग, फोरेंसिक, वॉचलिस्ट, ऑडिट रिपोर्ट, वॉइस अलर्ट और भाषा। नीचे एक उदाहरण चुनें।'
        : 'I did not understand that. I can help with: message scanning, website/link checks, QR/UPI safety, app verification, the scam registry, document/passport screening, forensics, watchlist, audit reports, voice alerts and language. Pick an example below.');
    }
  }, [input, push, langAttr]);

  useEffect(() => {
    if (open && messages.length === 0) {
      push('bot', langAttr === 'hi'
        ? 'नमस्ते! मैं आपका एजिसबॉर्ड एआई सहायक हूँ। मैं किसी भी जाँच या ख़तरा-जाँच सुविधा में आपका मार्गदर्शन कर सकता हूँ। आप क्या करना चाहेंगे?'
        : 'Hello! I am your on-device AegisBorder AI guide. Ask me how to use any screening or threat-check feature — or tap an example below.');
      push('bot', lang === 'hi'
        ? 'उदाहरण प्रश्न:'
        : 'Example questions:');
    }
  }, [open, messages.length, langAttr, lang, push]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const examples = EXAMPLE_QUESTIONS[langAttr] || EXAMPLE_QUESTIONS.en;

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-navy-800 to-navy-950 text-white shadow-xl transition-transform hover:scale-105 lg:bottom-6"
        aria-label="Open help guide" title="Help guide">
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-40 flex w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl lg:bottom-20">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-navy-900 px-4 py-3 text-white">
            <Shield className="h-4 w-4 text-amber-400" />
            <div>
              <div className="text-sm font-bold">Rakshak AI Guide</div>
              <div className="text-[10px] text-slate-300">On-device rules · no internet needed</div>
            </div>
          </div>

          <div ref={listRef} className="h-72 space-y-3 overflow-y-auto px-3 py-3" role="log" aria-live="polite" aria-label="Assistant messages">
            {messages.map((m, i) => (
              <div key={i} className={m.who === 'bot' ? 'mr-8' : 'ml-8'}>
                <div className={m.who === 'bot'
                  ? 'rounded-xl rounded-tl-sm bg-slate-100 px-3 py-2 text-sm text-slate-800'
                  : 'rounded-xl rounded-tr-sm bg-navy-800 px-3 py-2 text-sm text-white'}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-2 py-2">
            {examples.map((q) => (
              <button key={q} onClick={() => ask(q)}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-navy-50">
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex items-center gap-2 border-t border-slate-100 p-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={lang === 'hi' ? 'अपना प्रश्न लिखें…' : 'Type your question…'}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none" />
            <button type="submit" aria-label="Send" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-white hover:bg-navy-900">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}