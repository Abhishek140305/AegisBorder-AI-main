// Typosquatting, Homograph & Domain Analysis Engine
import legitimateData from '../data/legitimateInstitutions.json';
import { globalBloomFilter } from './bloomFilter.js';

// Levenshtein Distance implementation
export function levenshteinDistance(a, b) {
  const matrix = [];
  const lenA = a.length;
  const lenB = b.length;

  for (let i = 0; i <= lenB; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lenA; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= lenB; i++) {
    for (let j = 1; j <= lenA; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[lenB][lenA];
}

const HIGH_RISK_TLDS = [
  '.top', '.xyz', '.buzz', '.club', '.online', '.info', '.site',
  '.cc', '.tk', '.biz', '.live', '.win', '.icu', '.apk', '.app.net'
];

export function parseUrl(rawUrl) {
  let cleanUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'http://' + cleanUrl;
  }

  try {
    const urlObj = new URL(cleanUrl);
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname.toLowerCase(),
      pathname: urlObj.pathname,
      search: urlObj.search,
      raw: cleanUrl
    };
  } catch (err) {
    return {
      protocol: '',
      hostname: cleanUrl.split('/')[0].toLowerCase(),
      pathname: '',
      search: '',
      raw: cleanUrl
    };
  }
}

export function detectHomographs(domain) {
  // Check for non-ASCII or mixed script characters
  const nonAscii = /[^\u0000-\u007F]/.test(domain);
  const punycode = domain.startsWith('xn--');
  const numberSubstitutions = /[0-9]/.test(domain) && (domain.includes('0') || domain.includes('1') || domain.includes('5'));
  
  return {
    hasHomograph: nonAscii || punycode,
    isPunycode: punycode,
    hasNumberSubstitution: numberSubstitutions
  };
}

export function inspectUrl(inputUrl, lang = 'hi') {
  if (!inputUrl) return null;

  const parsed = parseUrl(inputUrl);
  const hostname = parsed.hostname;

  // 1. Check Offline Bloom Filter
  const bloomResult = globalBloomFilter.contains(hostname);

  // 2. Check Whitelist of Legitimate Institutions
  const allInstitutions = [...legitimateData.banks, ...legitimateData.governmentAndUtilities];
  let matchedLegitimate = null;

  for (const inst of allInstitutions) {
    if (inst.officialDomains.some(d => d.toLowerCase() === hostname)) {
      matchedLegitimate = inst;
      break;
    }
  }

  if (matchedLegitimate) {
    return {
      status: "SAFE",
      isThreat: false,
      riskScore: 0,
      domain: hostname,
      institution: matchedLegitimate.name,
      helpline: matchedLegitimate.helpline,
      category: matchedLegitimate.category,
      explanation: {
        en: `Verified official domain for ${matchedLegitimate.name}.`,
        hi: `${matchedLegitimate.name} की आधिकारिक एवं सत्यापित वेबसाइट।`
      },
      bloomLookupMs: bloomResult.lookupTimeMs
    };
  }

  // 3. Typosquatting Analysis against Legitimate Banks & Portals
  let closestMatch = null;
  let minDistance = Infinity;

  for (const inst of allInstitutions) {
    for (const officialDomain of inst.officialDomains) {
      // Direct substring spoofing check (e.g. sbi.co.in.attacker.top)
      const officialClean = officialDomain.replace(/^www\./, '');
      const hostClean = hostname.replace(/^www\./, '');

      if (hostClean.includes(officialClean.split('.')[0])) {
        const dist = levenshteinDistance(hostClean, officialClean);
        if (dist < minDistance) {
          minDistance = dist;
          closestMatch = {
            institution: inst.name,
            officialDomain: officialDomain,
            helpline: inst.helpline,
            distance: dist
          };
        }
      }
    }
  }

  // 4. Risky TLD & Subdomain Checks
  const hasRiskyTld = HIGH_RISK_TLDS.some(tld => hostname.endsWith(tld));
  const isApkDownload = parsed.pathname.toLowerCase().endsWith('.apk') || hostname.includes('.apk');
  const homographInfo = detectHomographs(hostname);

  // Determine Severity & Risk Score
  let riskScore = 15;
  let reasons = [];

  if (bloomResult.match) {
    riskScore = 99;
    reasons.push("Direct match in on-device Cyber Crime Blacklist (Bloom Filter).");
  }

  if (closestMatch && closestMatch.distance > 0) {
    riskScore = Math.max(riskScore, 95);
    reasons.push(`Domain spoofing / typosquatting target: ${closestMatch.institution} (Official: ${closestMatch.officialDomain}).`);
  }

  if (hasRiskyTld) {
    riskScore = Math.max(riskScore, 80);
    reasons.push(`Suspicious top-level domain frequently used in phishing campaigns.`);
  }

  if (isApkDownload) {
    riskScore = Math.max(riskScore, 96);
    reasons.push(`Attempts to directly download Android package (.apk) bypassing Google Play Store.`);
  }

  if (homographInfo.hasHomograph) {
    riskScore = Math.max(riskScore, 92);
    reasons.push(`Punycode / Homograph character substitution detected.`);
  }

  const isThreat = riskScore >= 70;

  return {
    status: isThreat ? "CRITICAL_DANGER" : "SUSPICIOUS",
    isThreat,
    riskScore,
    domain: hostname,
    fullUrl: parsed.raw,
    isApkDownload,
    spoofedTarget: closestMatch ? closestMatch.institution : null,
    officialDomain: closestMatch ? closestMatch.officialDomain : null,
    officialHelpline: closestMatch ? closestMatch.helpline : "1930 (National Cyber Helpline)",
    reasons,
    bloomLookupMs: bloomResult.lookupTimeMs,
    explanation: {
      en: isThreat
        ? `HIGH-RISK PHISHING DETECTED: This domain mimics ${closestMatch ? closestMatch.institution : 'a banking portal'} to steal your credentials.`
        : "Unverified domain. Proceed with caution.",
      hi: isThreat
        ? `फिशिंग का गंभीर खतरा: यह वेबसाइट ${closestMatch ? closestMatch.institution : 'बैंक'} के नाम की नकल करके बनाई गई है ताकि आपकी जानकारी चुराई जा सके।`
        : "अपुष्ट वेबसाइट। सावधानी बरतें।"
    }
  };
}
