// URL typosquatting / phishing analyzer (mirrors web app src/engine/urlDetector.js)
import { bloomFilter } from './bloom.js';
import { legitimateInstitutions } from './data.js';

const HIGH_RISK_TLDS = [
  '.top', '.xyz', '.buzz', '.club', '.online', '.info', '.site',
  '.cc', '.tk', '.biz', '.live', '.win', '.icu', '.apk'
];

export function levenshteinDistance(a, b) {
  const matrix = [];
  const lenA = a.length;
  const lenB = b.length;
  for (let i = 0; i <= lenB; i++) matrix[i] = [i];
  for (let j = 0; j <= lenA; j++) matrix[0][j] = j;
  for (let i = 1; i <= lenB; i++) {
    for (let j = 1; j <= lenA; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[lenB][lenA];
}

function parseHostname(rawUrl) {
  let clean = String(rawUrl || '').trim();
  if (!/^[a-z]+:\/\//i.test(clean)) clean = 'http://' + clean;
  try {
    return new URL(clean).hostname.toLowerCase();
  } catch (err) {
    return clean.split('/')[0].toLowerCase();
  }
}

export function inspectUrl(rawUrl) {
  if (!rawUrl) return null;
  const hostname = parseHostname(rawUrl);

  const bloom = bloomFilter.contains(hostname);

  const matchedLegit = legitimateInstitutions.find((inst) =>
    inst.officialDomains.some((d) => d.toLowerCase() === hostname)
  );

  if (matchedLegit) {
    return { isThreat: false, riskScore: 0, domain: hostname, safe: true, institution: matchedLegit.name };
  }

  let closest = null;
  let minDist = Infinity;
  const hostClean = hostname.replace(/^www\./, '');

  for (const inst of legitimateInstitutions) {
    for (const officialDomain of inst.officialDomains) {
      const officialClean = officialDomain.replace(/^www\./, '');
      if (hostClean.includes(officialClean.split('.')[0])) {
        const dist = levenshteinDistance(hostClean, officialClean);
        if (dist < minDist) {
          minDist = dist;
          closest = { institution: inst.name, officialDomain, distance: dist, helpline: inst.helpline };
        }
      }
    }
  }

  const hasRiskyTld = HIGH_RISK_TLDS.some((tld) => hostname.endsWith(tld));
  const isApk = /\.apk/i.test(hostname) || /\.apk/i.test(rawUrl.split('?')[0]);
  const punycode = hostname.startsWith('xn--');

  let riskScore = 15;
  const reasons = [];

  if (bloom.match) {
    riskScore = Math.max(riskScore, 99);
    reasons.push('Direct match in on-device Cyber Crime blacklist.');
  }
  if (closest && closest.distance > 0) {
    riskScore = Math.max(riskScore, 95);
    reasons.push(`Typosquatting target: ${closest.institution} (official: ${closest.officialDomain}).`);
  }
  if (hasRiskyTld) {
    riskScore = Math.max(riskScore, 80);
    reasons.push('Suspicious top-level domain used in phishing.');
  }
  if (isApk) {
    riskScore = Math.max(riskScore, 96);
    reasons.push('Attempts to download Android package (.apk) outside the Play Store.');
  }
  if (punycode) {
    riskScore = Math.max(riskScore, 92);
    reasons.push('Punycode / homograph character substitution detected.');
  }

  const isThreat = riskScore >= 70;

  return {
    isThreat,
    riskScore,
    domain: hostname,
    fullUrl: rawUrl,
    spoofedTarget: closest ? closest.institution : null,
    officialDomain: closest ? closest.officialDomain : null,
    helpline: closest ? closest.helpline : '1930 (National Cyber Helpline)',
    reasons,
    safe: !isThreat
  };
}
