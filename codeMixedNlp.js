// Code-Mixed Indic Threat Analyzer (Hinglish, Tanglish, Telglish, Regional Urgency)

export const HINGLISH_THREAT_PATTERNS = [
  {
    id: "UTILITY_ELECTRICITY_CUT",
    category: "URGENCY_UTILITY_FRAUD",
    severity: "CRITICAL",
    regex: /(bijli|bijlee|electric|power|light|current|bill|vidyut).*(kat|disconn|block|cut|ruk|baje|aaj raat|officer|line)/i,
    keywords: ["bijli", "bijli bill", "disconnection", "connection cut", "aaj raat", "officer"],
    urgencyScore: 95,
    title: {
      en: "Urgent Electricity Disconnection Threat",
      hi: "बिजली कनेक्शन काटने की फर्जी धमकी",
      ta: "மின் இணைப்பு துண்டிப்பு போலி எச்சரிக்கை",
      te: "విద్యుత్ కనెక్షన్ నిలిపివేత నకిలీ హెచ్చరిక",
      bn: "বিদ্যুৎ সংযোগ বিচ্ছিন্ন করার ভুয়া হুমকি",
      mr: "वीज कनेक्शन तोडण्याची बनावट धमकी"
    },
    explanation: {
      en: "Scammers create artificial panic claiming power will be cut tonight. Government electricity boards never send disconnection notices via personal WhatsApp or SMS numbers.",
      hi: "धोखेबाज बिजली कटने का डर दिखाकर पैसे लूटते हैं। बिजली विभाग कभी भी निजी मोबाइल नंबर या व्हाट्सएप से कनेक्शन काटने का मैसेज नहीं भेजता।",
      ta: "மின் கட்டணம் செலுத்தவில்லை என மிரட்டி மோசடி செய்கிறார்கள். அரசு தனிப்பட்ட எண்ணில் இருந்து எச்சரிக்கை அனுப்பாது.",
      te: "కరెంట్ కట్ అవుతుందని మోసగాళ్ళు భయపెడుతున్నారు. విద్యుత్ శాఖ వ్యక్తిగత నంబర్ల నుండి ఇలాంటి మెసేజ్‌లు పంపదు.",
      bn: "বিদ্যুৎ বিচ্ছিন্ন করার ভয় দেখিয়ে প্রতারকরা ফাঁদ ফেলে। বিদ্যুৎ বোর্ড কখনো ব্যক্তিগত নম্বর থেকে এসএমএস পাঠায় না।",
      mr: "वीज तोडण्याची भीती दाखवून फसवणूक केली जात आहे. महावितरण कधीही वैयक्तिक नंबरवरून असा मेसेज पाठवत नाही."
    },
    recommendation: {
      en: "Do not call the phone number mentioned in the SMS. Check your official electricity bill on the state discom portal.",
      hi: "एसएमएस में दिए गए नंबर पर कॉल न करें। अपने राज्य के आधिकारिक बिजली पोर्टल पर जाकर ही बिल जांचें।"
    }
  },
  {
    id: "BANK_KYC_ACCOUNT_SUSPEND",
    category: "BANK_IMPERSONATION",
    severity: "CRITICAL",
    regex: /(account|bank|kyc|pan|khata|pancard|yono|debit).*(block|suspend|update|verify|freeze|band|link karo|khatam|deactivate)/i,
    keywords: ["kyc", "account block", "pan link", "khata band", "verify", "update"],
    urgencyScore: 92,
    title: {
      en: "Bank Account / KYC Suspension Scam",
      hi: "बैंक खाता / केवाईसी बंद होने का फर्जी संदेश",
      ta: "வங்கி கணக்கு / KYC முடக்கப்படும் போலி செய்தி",
      te: "బ్యాంక్ ఖాతా / KYC బ్లాక్ అవుతుందని నకిలీ మెసేజ్",
      bn: "ব্যাংক অ্যাকাউন্ট / কেওয়াইসি বন্ধের ভুয়া নোটিশ",
      mr: "बँक खाते / केवायसी बंद होण्याची बनावट नोटीस"
    },
    explanation: {
      en: "Banks never threaten to block accounts within 24 hours via unverified SMS links. They never ask for OTPs or NetBanking passwords via forms.",
      hi: "बैंक कभी भी अनधिकृत लिंक भेजकर खाता ब्लॉक करने की धमकी नहीं देते। अपनी गोपनीय जानकारी या ओटीपी किसी के साथ साझा न करें।",
      ta: "வங்கி ஒருபோதும் இணைப்பை கிளிக் செய்து KYC புதுப்பிக்கச் சொல்லாது.",
      te: "బ్యాంకులు ఎప్పుడూ లింక్‌లు పంపి ఖాతాను అప్‌డేట్ చేయమని అడగవు.",
      bn: "ব্যাংক কখনো কোনো লিঙ্কে ক্লিক করে কেওয়াইসি আপডেট করতে বলে না।",
      mr: "बँक कधीही लिंक पाठवून खाते अपडेट करण्यास सांगत नाही."
    },
    recommendation: {
      en: "Visit your physical bank branch or use the official mobile banking application only.",
      hi: "केवल बैंक की आधिकारिक शाखा में जाएं या आधिकारिक बैंकिंग ऐप का उपयोग करें।"
    }
  },
  {
    id: "LOTTERY_CASHBACK_LURE",
    category: "LOTTERY_LURE",
    severity: "HIGH",
    regex: /(lottery|jeeta|won|cashback|reward|inam|paisa|kbc|lucky|claim|congratulation).*(claim|paisa|link|upi|pin|account|khathe|rupaye)/i,
    keywords: ["lottery", "jeeta", "cashback", "reward", "kbc", "inam", "lucky draw"],
    urgencyScore: 85,
    title: {
      en: "Fake Lottery / Cashback Reward Lure",
      hi: "फर्जी लॉटरी व कैशबैक इनाम का लालच",
      ta: "போலி பரிசு / கேஷ்பேக் ஆசைவார்த்தை",
      te: "నకిలీ లాటరీ / క్యాష్‌బ్యాక్ బహుమతి ఎర",
      bn: "ভুয়া লটারি ও ক্যাশব্যাকের প্রলোভন",
      mr: "बनावट लॉटरी आणि कॅशबॅकचे आमिष"
    },
    explanation: {
      en: "You cannot win a contest or lottery you never participated in. Scammers use this lure to trigger UPI debit collect requests.",
      hi: "जिस लॉटरी या प्रतियोगिता में आपने कभी भाग नहीं लिया, उसमें आप कभी पैसे नहीं जीत सकते। यह आपके खाते से पैसे काटने की चाल है।",
      ta: "நீங்கள் பங்கேற்காத போட்டியில் உங்களுக்கு பரிசு கிடைக்காது.",
      te: "మీరు పాల్గొనని పోటీలో మీకు బహుమతి రాదు.",
      bn: "আপনি যে প্রতিযোগিতায় অংশ নেননি তাতে পুরস্কার জেতা অসম্ভব।",
      mr: "ज्या स्पर्धेत तुम्ही भाग घेतला नाही त्यात बक्षीस जिंकणे शक्य नाही."
    },
    recommendation: {
      en: "Do not scan any QR code or enter your UPI PIN to claim rewards.",
      hi: "इनाम पाने के लिए कभी भी कोई क्यूआर कोड स्कैन न करें और न ही यूपीआई पिन डालें।"
    }
  },
  {
    id: "REMOTE_ACCESS_SUPPORT",
    category: "RAT_SOCIAL_ENGINEERING",
    severity: "CRITICAL",
    regex: /(anydesk|teamviewer|rustdesk|quicksupport|screen share|apk|install|download|helpdesk|support officer)/i,
    keywords: ["anydesk", "quicksupport", "screen share", "apk download", "support app"],
    urgencyScore: 98,
    title: {
      en: "Screen Sharing / Remote Access Trojan Scam",
      hi: "स्क्रीन शेयरिंग व रिमोट एक्सेस ऐप का खतरा",
      ta: "திரை பகிர்வு / ரிமோட் அணுகல் மோசடி",
      te: "స్క్రీన్ షేరింగ్ / రిమోట్ యాక్సెస్ మోసం",
      bn: "স্ক্রিন শেয়ারিং এবং রিমোট অ্যাক্সেস প্রতারণা",
      mr: "स्क्रीन शेअरिंग आणि रिमोट ॲक्सेस फसवणूक"
    },
    explanation: {
      en: "Never install AnyDesk, QuickSupport, or unverified APKs on instructions from unknown callers. They gain full access to view your screen and steal SMS OTPs.",
      hi: "अज्ञात कॉल पर किसी के कहने पर AnyDesk या कोई APK डाउनलोड न करें। इससे वे आपके फोन की स्क्रीन देखकर बैंक ओटीपी चुरा लेते हैं।",
      ta: "அந்நியர்கள் சொல்லும் எந்த செயலியையும் பதிவிறக்கம் செய்யாதீர்கள்.",
      te: "తెలియని వ్యక్తులు చెప్పే యాప్‌లను ఎట్టి పరిస్థితుల్లోనూ ఇన్‌స్టాల్ చేయవద్దు.",
      bn: "অপরিচিত ব্যক্তির কথায় কোনো অ্যাপ ইনস্টল করবেন না।",
      mr: "अनोळखी व्यक्तीच्या सांगण्यावरून कोणतेही ॲप इन्स्टॉल करू नका."
    },
    recommendation: {
      en: "Immediately uninstall suspicious apps and disconnect from the internet.",
      hi: "संदिग्ध ऐप्स को तुरंत अनइंस्टॉल करें और फोन का इंटरनेट बंद करें।"
    }
  },
  {
    id: "TRAFFIC_CHALLAN_LEGAL",
    category: "LEGAL_COERCION",
    severity: "HIGH",
    regex: /(challan|traffic|court|arrest|police|cyber cell|warrant|fir|jail).*(pay|bhare|link|immediate|penalty|fine)/i,
    keywords: ["challan", "traffic", "court", "arrest", "warrant", "fir"],
    urgencyScore: 90,
    title: {
      en: "Fake Traffic Challan / Legal Threat",
      hi: "फर्जी ई-चालान व कानूनी गिरफ्तारी की धमकी",
      ta: "போலி போக்குவரத்து சலான் எச்சரிக்கை",
      te: "నకిలీ ట్రాఫిక్ చలాన్ / చట్టపరమైన బెదిరింపు",
      bn: "ভুয়া ট্রাফিক চালান ও মামলার ভয়",
      mr: "बनावट ई-चलन आणि अटकेची धमकी"
    },
    explanation: {
      en: "Scammers send fake traffic fine APK links or phishing portals pretending to be state police or courts.",
      hi: "धोखेबाज फर्जी ई-चालान और पुलिस की धमकी देकर पैसे ऐंठते हैं या फोन में वायरस वाला ऐप डलवाते हैं।",
      ta: "போக்குவரத்து அபராதம் செலுத்த போலி இணைப்புகளை அனுப்புகிறார்கள்.",
      te: "ట్రాఫిక్ చలాన్ పేరుతో నకిలీ లింకులు పంపుతున్నారు.",
      bn: "ট্রাফিক চালানের নামে ভুয়া লিঙ্ক পাঠিয়ে প্রতারণা করা হয়।",
      mr: "ट्रॅफिक चलनाच्या नावाखाली बनावट लिंक पाठवून फसवणूक केली जाते."
    },
    recommendation: {
      en: "Verify challans only on the official Ministry of Road Transport portal (echallan.parivahan.gov.in).",
      hi: "चालान की जांच केवल आधिकारिक परिवहन पोर्टल (echallan.parivahan.gov.in) पर करें।"
    }
  }
];

export function analyzeMessage(text, lang = 'hi', options = {}) {
  const { isKnownContact = false, senderInfo = "+91 98765 43210 (Unknown Sender)" } = options;

  if (!text || typeof text !== 'string') {
    return {
      isThreat: false,
      riskScore: 0,
      matches: [],
      analysis: "No text provided"
    };
  }

  const normalizedText = text.toLowerCase().replace(/[\n\r]+/g, ' ');

  // Check for suspicious URLs or phone numbers embedded inside text
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:top|xyz|info|site|buzz|club|online|cc|tk|biz|live|win|apk))/gi;
  const phoneRegex = /(\+?91[\s-]?)?[6-9]\d{9}/g;
  
  const extractedUrls = normalizedText.match(urlRegex) || [];
  const extractedPhones = normalizedText.match(phoneRegex) || [];

  // PRIVACY & USABILITY FILTER: Bypass deep scanning for verified known contacts
  if (isKnownContact) {
    return {
      isThreat: false,
      isKnownContact: true,
      riskScore: 0,
      severity: "SAFE",
      category: "TRUSTED_CONTACT_BYPASS",
      title: "Trusted / Saved Contact (Scanning Bypassed)",
      explanation: {
        en: `Message is from a saved contact (${senderInfo}). Deep link and threat inspection is bypassed to protect user privacy and avoid alert fatigue.`,
        hi: `यह संदेश आपके सहेजे गए संपर्क (${senderInfo}) से आया है। गोपनीयता बनाए रखने के लिए इसकी स्वचालित जांच रोक दी गई है।`
      },
      recommendation: {
        en: "Rakshak AI only activates active deep inspection for messages and links received from UNKNOWN / UNSAVED numbers.",
        hi: "रक्षक एआई केवल अज्ञात और अनजान नंबरों से आए संदेशों और लिंक्स की ही गहन जांच करता है।"
      },
      matches: [],
      extractedUrls,
      extractedPhones,
      senderInfo,
      bypassedForPrivacy: true,
      timestamp: new Date().toISOString()
    };
  }

  const matches = [];
  let highestScore = 0;
  let detectedCategory = null;
  let bestTitle = "";
  let bestExplanation = "";
  let bestRecommendation = "";

  for (const pattern of HINGLISH_THREAT_PATTERNS) {
    if (pattern.regex.test(normalizedText)) {
      matches.push({
        id: pattern.id,
        category: pattern.category,
        severity: pattern.severity,
        urgencyScore: pattern.urgencyScore,
        matchedKeywords: pattern.keywords.filter(kw => normalizedText.includes(kw))
      });

      if (pattern.urgencyScore > highestScore) {
        highestScore = pattern.urgencyScore;
        detectedCategory = pattern.category;
        bestTitle = pattern.title[lang] || pattern.title.en;
        bestExplanation = pattern.explanation[lang] || pattern.explanation.en;
        bestRecommendation = pattern.recommendation[lang] || pattern.recommendation.en;
      }
    }
  }

  const isThreat = matches.length > 0 || extractedUrls.some(u => u.includes('.apk') || u.includes('.top') || u.includes('.xyz'));
  const finalRiskScore = isThreat ? Math.max(highestScore, extractedUrls.length ? 88 : 75) : 10;

  return {
    isThreat,
    isKnownContact: false,
    riskScore: finalRiskScore,
    severity: finalRiskScore >= 85 ? "CRITICAL" : finalRiskScore >= 60 ? "HIGH" : "SAFE",
    category: detectedCategory || (isThreat ? "SUSPICIOUS_MESSAGE" : "INFORMATIONAL"),
    title: bestTitle || (isThreat ? "Suspicious Message from Unknown Sender" : "Normal Message"),
    explanation: bestExplanation || (isThreat ? "This message from an unknown number contains red-flag social engineering patterns." : "No known scam patterns detected."),
    recommendation: bestRecommendation || (isThreat ? "Do not interact with the unknown sender or click links." : "Safe to read."),
    matches,
    extractedUrls,
    extractedPhones,
    senderInfo,
    timestamp: new Date().toISOString()
  };
}
