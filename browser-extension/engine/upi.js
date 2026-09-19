// UPI deep-link inspector (mirrors web app src/engine/upiQrDetector.js)
import { bloomFilter } from './bloom.js';

const DECEPTIVE_KEYWORDS = ['cashback', 'reward', 'refund', 'winner', 'lottery', 'prize', 'gift', 'claim', 'bonus'];

export function inspectUpi(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!/^upi:\/\/pay/i.test(s) && !s.includes('@')) return null;

  let params = {};
  if (s.startsWith('upi://pay')) {
    const qs = s.split('?')[1] || '';
    new URLSearchParams(qs).forEach((v, k) => { params[k.toLowerCase()] = v; });
  } else if (s.includes('@')) {
    params.pa = s.replace(/^upi:\/\//i, '');
  }

  const vpa = params.pa || '';
  const payeeName = params.pn || '';
  const amount = params.am ? parseFloat(params.am) : null;
  const note = params.tn || '';

  const bloom = bloomFilter.contains(vpa);
  const hasDeceptive = DECEPTIVE_KEYWORDS.some(
    (kw) => vpa.toLowerCase().includes(kw) || payeeName.toLowerCase().includes(kw) || note.toLowerCase().includes(kw)
  );

  let riskScore = 10;
  const reasons = [];
  if (bloom.match) {
    riskScore = Math.max(riskScore, 99);
    reasons.push('VPA is listed on the National Fraud & Sybil Registry.');
  }
  if (hasDeceptive) {
    riskScore = Math.max(riskScore, 92);
    reasons.push("Deceptive 'Cashback/Reward' name used to lure a payment.");
  }
  if (amount && hasDeceptive) {
    riskScore = Math.max(riskScore, 98);
    reasons.push(`Automated Rs.${amount} DEBIT transaction disguised as a reward claim.`);
  }

  const isThreat = riskScore >= 70;
  return {
    isThreat,
    riskScore,
    reasons,
    vpa,
    amount,
    payeeName,
    hasDeceptive,
    frictionMessage: 'DANGER: UPI PIN is ONLY entered to SEND money, NEVER to receive rewards!'
  };
}
