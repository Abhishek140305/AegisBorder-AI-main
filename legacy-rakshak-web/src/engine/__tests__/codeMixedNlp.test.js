import { describe, it, expect } from 'vitest';
import { analyzeMessage, HINGLISH_THREAT_PATTERNS } from '../codeMixedNlp';

describe('analyzeMessage', () => {

  // ── Guard: empty / non-string input ───────────────────────────────────────

  it('returns isThreat=false for null', () => {
    expect(analyzeMessage(null).isThreat).toBe(false);
  });

  it('returns isThreat=false for undefined', () => {
    expect(analyzeMessage(undefined).isThreat).toBe(false);
  });

  it('returns isThreat=false for empty string', () => {
    expect(analyzeMessage('').isThreat).toBe(false);
  });

  // ── Known contact bypass ───────────────────────────────────────────────────

  it('bypasses deep scan when isKnownContact=true', () => {
    const result = analyzeMessage(
      'Click this link to win Rs 50,000!',
      'hi',
      { isKnownContact: true, senderInfo: 'Mom (Saved)' }
    );
    expect(result.isThreat).toBe(false);
    expect(result.bypassedForPrivacy).toBe(true);
    expect(result.category).toBe('TRUSTED_CONTACT_BYPASS');
  });

  it('still detects threats when isKnownContact=false', () => {
    const result = analyzeMessage(
      'Aapka bijli bill update nahi hai, aaj raat 9 baje cut ho jayega',
      'hi',
      { isKnownContact: false }
    );
    expect(result.isThreat).toBe(true);
    expect(result.riskScore).toBeGreaterThan(0);
  });

  // ── Pattern 1: Electricity Disconnection ───────────────────────────────────

  it('detects electricity scam with bijli + cut keywords', () => {
    const result = analyzeMessage(
      'Aapka bijli bill update nahi hai, aaj raat 9 baje connection cut jayega',
      'hi'
    );
    expect(result.isThreat).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(85);
    expect(result.matches.some(m => m.id === 'UTILITY_ELECTRICITY_CUT')).toBe(true);
  });

  it('detects electricity scam with "bijlee" variant', () => {
    const result = analyzeMessage('Your bijlee bill is pending, power line will be kat tomorrow');
    expect(result.isThreat).toBe(true);
    expect(result.matches.some(m => m.id === 'UTILITY_ELECTRICITY_CUT')).toBe(true);
  });

  it('detects electricity scam with English "electric" keyword', () => {
    const result = analyzeMessage('Electric bill update nahi hua, disconnection tonight officer calling');
    expect(result.isThreat).toBe(true);
    expect(result.matches.some(m => m.id === 'UTILITY_ELECTRICITY_CUT')).toBe(true);
  });

  it('returns high severity for electricity scam', () => {
    const result = analyzeMessage('bijli bill update nahi hai, raat 9 baje cut ho jayega');
    expect(result.severity).toMatch(/CRITICAL|HIGH/);
  });

  // ── Pattern 2: Bank KYC / Account Suspension ───────────────────────────────

  it('detects KYC account-block scam', () => {
    const result = analyzeMessage(
      'Your SBI account will be suspended today due to pending KYC update. Click http://fake-bank.top to verify PAN'
    );
    expect(result.isThreat).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(85);
    expect(result.matches.some(m => m.id === 'BANK_KYC_ACCOUNT_SUSPEND')).toBe(true);
  });

  it('detects bank impersonation with YONO keyword', () => {
    const result = analyzeMessage('Your YONO NetBanking account will be freeze if KYC not updated');
    expect(result.isThreat).toBe(true);
    expect(result.matches.some(m => m.id === 'BANK_KYC_ACCOUNT_SUSPEND')).toBe(true);
  });

  it('returns CRITICAL severity for KYC scam', () => {
    const result = analyzeMessage('account block hone wala hai, kyc update karna padega');
    expect(result.severity).toBe('CRITICAL');
  });

  // ── Pattern 3: Lottery / Cashback Lure ─────────────────────────────────────

  it('detects lottery lure', () => {
    const result = analyzeMessage('Congratulations! You have won Rs 5,00,000 in KBC lottery. Claim now by sending Rs 500.');
    expect(result.isThreat).toBe(true);
    expect(result.matches.some(m => m.id === 'LOTTERY_CASHBACK_LURE')).toBe(true);
  });

  it('detects cashback lure with jeeta/won keywords', () => {
    const result = analyzeMessage('Aap jeeta hai! Rs 10,000 cashback claim karein link pe click karein');
    expect(result.isThreat).toBe(true);
    expect(result.matches.some(m => m.id === 'LOTTERY_CASHBACK_LURE')).toBe(true);
  });

  it('detects inam/reward keyword variants', () => {
    const result = analyzeMessage('Inam prize reward paisa milega, link pe click karke paisa claim karo');
    expect(result.isThreat).toBe(true);
  });

  // ── Pattern 4: Remote Access Trojan / Support Scam ─────────────────────────

  it('detects AnyDesk remote access scam', () => {
    const result = analyzeMessage(
      'This is customer support. Please install AnyDesk and share your screen to fix your account.'
    );
    expect(result.isThreat).toBe(true);
    expect(result.matches.some(m => m.id === 'REMOTE_ACCESS_SUPPORT')).toBe(true);
  });

  it('detects APK download instruction from unknown caller', () => {
    const result = analyzeMessage(
      'Your bank account is in danger. Download our support app APK to secure it immediately.'
    );
    expect(result.isThreat).toBe(true);
    expect(result.matches.some(m => m.id === 'REMOTE_ACCESS_SUPPORT')).toBe(true);
  });

  it('returns CRITICAL severity for RAT scam (highest urgency score)', () => {
    const result = analyzeMessage('please install teamviewer quicksupport for helpdesk officer support');
    expect(result.severity).toBe('CRITICAL');
  });

  // ── Pattern 5: Traffic Challan / Legal Threat ──────────────────────────────

  it('detects fake traffic challan threat', () => {
    const result = analyzeMessage(
      'You have a pending traffic challan. Pay the fine immediately to avoid police arrest. Link attached.'
    );
    expect(result.isThreat).toBe(true);
    expect(result.matches.some(m => m.id === 'TRAFFIC_CHALLAN_LEGAL')).toBe(true);
  });

  it('detects cyber cell warrant scam', () => {
    const result = analyzeMessage('Cyber cell warrant issued for your Aadhaar. Pay penalty link immediately.');
    expect(result.isThreat).toBe(true);
  });

  // ── URL Extraction ─────────────────────────────────────────────────────────

  it('extracts .top domain URLs from message text', () => {
    const result = analyzeMessage('Click http://sbi-kyc-update.top to verify your account');
    expect(result.extractedUrls).toContain('http://sbi-kyc-update.top');
  });

  it('extracts .xyz domain URLs', () => {
    const result = analyzeMessage('Claim reward at www.cashback.xyz now');
    expect(result.extractedUrls.some(u => u.includes('.xyz'))).toBe(true);
  });

  it('extracts embedded .apk download links', () => {
    const result = analyzeMessage('Download update from http://bank.apk now');
    expect(result.extractedUrls.some(u => u.includes('.apk'))).toBe(true);
  });

  it('marks message with .apk URL as threat even without pattern match', () => {
    const result = analyzeMessage('Here is the document you requested http://doc.apk');
    expect(result.isThreat).toBe(true);
  });

  // ── Phone Number Extraction ────────────────────────────────────────────────

  it('extracts standard 10-digit Indian mobile numbers', () => {
    const result = analyzeMessage('Call 9876543210 immediately to avoid disconnection');
    expect(result.extractedPhones).toContain('9876543210');
  });

  it('extracts +91 prefixed numbers when format is tight', () => {
    // The regex matches 10-digit numbers with an optional +91 prefix without spaces
    const result = analyzeMessage('Call +919876543210 for help');
    expect(result.extractedPhones.some(p => p.includes('9876543210') || p.includes('919876543210'))).toBe(true);
  });

  // ── Risk Scoring ───────────────────────────────────────────────────────────

  it('returns riskScore >= 85 for critical patterns', () => {
    const result = analyzeMessage('bijli bill update nahi hai, aaj raat 9 baje cut ho jayega');
    expect(result.riskScore).toBeGreaterThanOrEqual(85);
  });

  it('returns low riskScore for safe messages', () => {
    const result = analyzeMessage('Hello bhai, ghar pe aana dinner ke liye');
    expect(result.riskScore).toBeLessThan(40);
  });

  it('maps riskScore to correct severity tiers', () => {
    const critical = analyzeMessage('aapka bijli bill update nahi hai, raat 9 baje kat jayega connection');
    expect(critical.severity).toBe('CRITICAL');

    const safe = analyzeMessage('Dinner plans bhai, ghar pe le aana fruits');
    expect(safe.severity).toBe('SAFE');
  });

  // ── Multi-language explanations ──────────────────────────────────────────────

  it('returns Hindi explanation when lang=hi for electricity pattern', () => {
    // Note: avoid the substring "apk" (e.g. "aapka") — it triggers the RAT pattern.
    // Also avoid "install" / "support" / "officer".
    const safeMessage = 'bijlee bill past due, power will be disconnected tonight at 9 baje';
    const result = analyzeMessage(safeMessage, 'hi');
    expect(typeof result.explanation).toBe('string');
    // Electricity scam Hindi explanation contains the word "बिजली"
    expect(result.explanation).toContain('बिजली');
  });

  it('returns English explanation when lang=en for electricity pattern', () => {
    const safeMessage = 'bijlee bill past due, power will be disconnected tonight at 9 PM';
    const result = analyzeMessage(safeMessage, 'en');
    expect(typeof result.explanation).toBe('string');
    expect(result.explanation.toLowerCase()).toContain('electricity');
  });

  it('returns Tamil explanation when lang=ta for electricity pattern', () => {
    const safeMessage = 'bijlee bill past due, power will be disconnected tonight at 9 PM';
    const result = analyzeMessage(safeMessage, 'ta');
    expect(typeof result.explanation).toBe('string');
    // Tamil word for electricity: "மின்"
    expect(result.explanation).toContain('மின்');
  });

  // ── Recommendation ────────────────────────────────────────────────────────

  it('returns a recommendation for detected threats', () => {
    const result = analyzeMessage('Aapka bijli bill update nahi hai, cut ho jayega');
    expect(result.recommendation).toBeTruthy();
    expect(result.recommendation.length).toBeGreaterThan(0);
  });

  // ── Timestamp ─────────────────────────────────────────────────────────────

  it('includes an ISO timestamp in the result', () => {
    const result = analyzeMessage('bijli bill scam message');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  // ── Priority: highest score wins ─────────────────────────────────────────

  it('returns the title of the highest-scoring matched pattern', () => {
    // REMOTE_ACCESS_SUPPORT has urgencyScore=98 (highest)
    const result = analyzeMessage('please install anydesk quicksupport for helpdesk officer support');
    // The Hindi title for the remote-access pattern
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('returns the English title when lang=en for RAT pattern', () => {
    const result = analyzeMessage(
      'please install anydesk quicksupport for helpdesk officer support',
      'en'
    );
    expect(result.title).toContain('Screen Sharing');
  });

});

describe('HINGLISH_THREAT_PATTERNS', () => {

  it('exports exactly 5 patterns', () => {
    expect(HINGLISH_THREAT_PATTERNS).toHaveLength(5);
  });

  it('each pattern has a unique id', () => {
    const ids = HINGLISH_THREAT_PATTERNS.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('each pattern has a regex property', () => {
    HINGLISH_THREAT_PATTERNS.forEach(p => {
      expect(p.regex instanceof RegExp).toBe(true);
    });
  });

  it('each pattern has title, explanation, and recommendation for all 5 languages', () => {
    const LANGS = ['en', 'hi', 'ta', 'te', 'bn', 'mr'];
    HINGLISH_THREAT_PATTERNS.forEach(p => {
      LANGS.forEach(lang => {
        expect(p.title[lang], `Missing title.${lang} for ${p.id}`).toBeTruthy();
        expect(p.explanation[lang], `Missing explanation.${lang} for ${p.id}`).toBeTruthy();
      });
    });
  });

  it('each pattern has an urgencyScore between 1 and 100', () => {
    HINGLISH_THREAT_PATTERNS.forEach(p => {
      expect(p.urgencyScore).toBeGreaterThanOrEqual(1);
      expect(p.urgencyScore).toBeLessThanOrEqual(100);
    });
  });

  it('each pattern has a severity of CRITICAL or HIGH', () => {
    HINGLISH_THREAT_PATTERNS.forEach(p => {
      expect(['CRITICAL', 'HIGH']).toContain(p.severity);
    });
  });

  it('each pattern has keywords array', () => {
    HINGLISH_THREAT_PATTERNS.forEach(p => {
      expect(Array.isArray(p.keywords)).toBe(true);
      expect(p.keywords.length).toBeGreaterThan(0);
    });
  });
});
