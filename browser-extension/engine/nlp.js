// Code-mixed Indic threat pattern analyzer (mirrors web app src/engine/codeMixedNlp.js)
export const THREAT_PATTERNS = [
  {
    id: 'UTILITY_ELECTRICITY_CUT',
    category: 'URGENCY_UTILITY_FRAUD',
    severity: 'CRITICAL',
    regex: /(bijli|bijlee|electric|power|light|current|bill|vidyut).*(kat|disconn|block|cut|ruk|baje|aaj raat|officer|line)/i,
    keywords: ['bijli', 'bijli bill', 'disconnection', 'connection cut', 'aaj raat', 'officer'],
    urgencyScore: 95,
    title: 'Electricity Disconnection Threat',
    explanation: 'Scammers create artificial panic claiming power will be cut tonight. Electricity boards never send disconnection notices via personal numbers.',
    recommendation: 'Do not call the number in the message. Check your official bill on the state discom portal.'
  },
  {
    id: 'BANK_KYC_ACCOUNT_SUSPEND',
    category: 'BANK_IMPERSONATION',
    severity: 'CRITICAL',
    regex: /(account|bank|kyc|pan|khata|pancard|yono|debit).*(block|suspend|update|verify|freeze|band|link karo|khatam|deactivate)/i,
    keywords: ['kyc', 'account block', 'pan link', 'khata band', 'verify', 'update'],
    urgencyScore: 92,
    title: 'Bank Account / KYC Suspension Scam',
    explanation: 'Banks never threaten to block accounts within hours via unverified links, and never ask for OTPs or passwords through forms.',
    recommendation: 'Visit your physical bank branch or use the official mobile banking app only.'
  },
  {
    id: 'LOTTERY_CASHBACK_LURE',
    category: 'LOTTERY_LURE',
    severity: 'HIGH',
    regex: /(lottery|jeeta|won|cashback|reward|inam|paisa|kbc|lucky|claim|congratulation).*(claim|paisa|link|upi|pin|account|khathe|rupaye)/i,
    keywords: ['lottery', 'jeeta', 'cashback', 'reward', 'kbc', 'inam', 'lucky draw'],
    urgencyScore: 85,
    title: 'Fake Lottery / Cashback Reward Lure',
    explanation: 'You cannot win a contest you never entered. This lure is used to trigger UPI debit requests.',
    recommendation: 'Never scan a QR code or enter your UPI PIN to claim rewards.'
  },
  {
    id: 'REMOTE_ACCESS_SUPPORT',
    category: 'RAT_SOCIAL_ENGINEERING',
    severity: 'CRITICAL',
    regex: /(anydesk|teamviewer|rustdesk|quicksupport|screen share|\bapk\b|install|download|helpdesk|support officer)/i,
    keywords: ['anydesk', 'quicksupport', 'screen share', 'apk download', 'support app'],
    urgencyScore: 98,
    title: 'Screen Sharing / Remote Access Scam',
    explanation: 'Never install AnyDesk, QuickSupport, or unverified APKs on instructions from unknown people. They gain full screen access and steal OTPs.',
    recommendation: 'Uninstall suspicious apps and disconnect from the internet immediately.'
  },
  {
    id: 'TRAFFIC_CHALLAN_LEGAL',
    category: 'LEGAL_COERCION',
    severity: 'HIGH',
    regex: /(challan|traffic|court|arrest|police|cyber cell|warrant|fir|jail).*(pay|bhare|link|immediate|penalty|fine)/i,
    keywords: ['challan', 'traffic', 'court', 'arrest', 'warrant', 'fir'],
    urgencyScore: 90,
    title: 'Fake Traffic Challan / Legal Threat',
    explanation: 'Scammers send fake fine APK links or phishing portals pretending to be police or courts.',
    recommendation: 'Verify challans only on the official portal: echallan.parivahan.gov.in.'
  }
];

const urlLikePattern = /(https?:\/\/[^\s"'<>()]+|www\.[^\s"'<>()]+)/gi;
const apkUrlPattern = /\.(apk)\b/i;
const highRiskTldPattern = /\.(top|xyz|info|site|buzz|club|online|cc|tk|biz|live|win|apk)/i;
const phonePattern = /(\+?91[\s-]?)?[6-9]\d{9}/g;

export function analyzeText(text) {
  if (!text || typeof text !== 'string') {
    return { isThreat: false, riskScore: 0, severity: 'SAFE', matches: [], extUrls: [] };
  }

  const normalized = text.toLowerCase();

  const extUrls = text.match(urlLikePattern) || [];
  let dangerUrl = false;
  for (const u of extUrls) {
    if (apkUrlPattern.test(u) || highRiskTldPattern.test(u)) dangerUrl = true;
  }
  const extPhones = text.match(phonePattern) || [];

  const matches = [];
  let highest = 0;
  let best = null;

  for (const p of THREAT_PATTERNS) {
    if (p.regex.test(normalized)) {
      matches.push(p);
      if (p.urgencyScore > highest) {
        highest = p.urgencyScore;
        best = p;
      }
    }
  }

  const isThreat = matches.length > 0 || dangerUrl;
  const riskScore = isThreat ? Math.max(highest, dangerUrl ? 88 : 70) : 10;

  return {
    isThreat,
    riskScore,
    severity: riskScore >= 85 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'SAFE',
    matches,
    best,
    extUrls,
    extPhones,
    dangerUrl
  };
}
