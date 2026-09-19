// UPI Deep-Link Schema Inspector & Micro-Friction Intent Gate
import { globalBloomFilter } from './bloomFilter.js';

export function parseUpiPayload(payload) {
  if (!payload || typeof payload !== 'string') {
    return null;
  }

  const raw = payload.trim();
  let params = {};
  let isUpiScheme = false;

  if (raw.startsWith('upi://pay')) {
    isUpiScheme = true;
    const queryString = raw.split('?')[1] || '';
    const searchParams = new URLSearchParams(queryString);

    searchParams.forEach((val, key) => {
      params[key.toLowerCase()] = val;
    });
  } else if (raw.includes('@')) {
    // Standalone VPA entered directly
    params.pa = raw;
  }

  const vpa = params.pa || '';
  const payeeName = params.pn || 'Unknown Merchant / Receiver';
  const amount = params.am ? parseFloat(params.am) : null;
  const transactionNote = params.tn || '';
  const currency = params.cu || 'INR';

  // Check Bloom Filter for malicious VPAs
  const bloomResult = globalBloomFilter.contains(vpa);

  // Check deceptive note or payee name indicating "Cashback / Refund / Prize"
  const deceptiveKeywords = ['cashback', 'reward', 'refund', 'winner', 'lottery', 'prize', 'gift', 'claim', 'bonus'];
  const hasDeceptiveIntent = deceptiveKeywords.some(
    kw => vpa.toLowerCase().includes(kw) || payeeName.toLowerCase().includes(kw) || transactionNote.toLowerCase().includes(kw)
  );

  let riskScore = 10;
  let riskReasons = [];

  if (bloomResult.match) {
    riskScore = 99;
    riskReasons.push("VPA is listed on the National Fraud & Sybil Registry.");
  }

  if (hasDeceptiveIntent) {
    riskScore = Math.max(riskScore, 92);
    riskReasons.push("Deceptive 'Cashback/Reward' name detected to lure user into completing a payment.");
  }

  // If amount is set in a payment link sent to a user claiming to give money:
  if (amount && hasDeceptiveIntent) {
    riskScore = Math.max(riskScore, 98);
    riskReasons.push(`Automated ₹${amount} DEBIT transaction disguised as reward claim.`);
  }

  const isThreat = riskScore >= 70;

  return {
    rawPayload: raw,
    isUpiScheme,
    vpa,
    payeeName,
    amount,
    currency,
    transactionNote,
    isThreat,
    riskScore,
    riskReasons,
    hasDeceptiveIntent,
    bloomLookupMs: bloomResult.lookupTimeMs,
    // Critical warning explaining that UPI PIN = Sending Money
    actionType: "DEBIT_PAYMENT",
    frictionMessage: {
      en: amount 
        ? `DANGER: This QR/link will DEDUCT ₹${amount} from YOUR bank account. UPI PIN is NEVER needed to receive money!` 
        : `DANGER: You are about to initiate a payment to ${payeeName}. You cannot receive money by scanning this code!`,
      hi: amount
        ? `सावधान: यह क्यूआर कोड स्कैन करने पर आपके खाते से ₹${amount} कट जाएंगे। पैसे प्राप्त करने के लिए कभी भी पिन डालने की आवश्यकता नहीं होती!`
        : `सावधान: आप ${payeeName} को पैसे भेज रहे हैं। यह कोड स्कैन करके आपको कोई पैसा या कैशबैक नहीं मिलेगा!`
    }
  };
}
