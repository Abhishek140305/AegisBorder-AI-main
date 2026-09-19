import { describe, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import RiskResultCard from '../../components/RiskResultCard.jsx';

/*
 * Regression test: previously the shared RiskScoreBar child component used
 * `currentLang` without receiving it as a prop, throwing
 * "ReferenceError: currentLang is not defined" whenever any analyzer
 * (message / URL / QR / APK checker) rendered a scan result - blanking the
 * whole screen. This must never happen again for any result shape/language.
 */
const LANGS = ['hi', 'en', 'ta', 'te', 'bn', 'mr'];

const RESULT_SHAPES = [
  // danger (message scanner: codeMixedNlp output)
  {
    riskScore: 95,
    severity: 'CRITICAL',
    title: 'Urgent Electricity Disconnection Threat',
    explanation: { en: 'Scam', hi: 'धोखा' },
    recommendation: 'Do not call.',
    matches: [{ category: 'URGENCY_UTILITY_FRAUD', matchedKeywords: ['bijli'] }],
  },
  // safe (message scanner, known contact / normal)
  { riskScore: 10, severity: 'SAFE', status: 'SAFE', title: 'Normal Message', explanation: 'No scam patterns detected.' },
  // caution (urlDetector output shape)
  {
    riskScore: 92,
    status: 'CRITICAL_DANGER',
    domain: 'sbi-bank-kyc-update.top',
    reasons: ['Typosquatting target: State Bank of India (SBI).', 'Suspicious TLD.'],
    title: 'HIGH-RISK PHISHING DETECTED',
    explanation: { en: 'Phishing', hi: 'फिशिंग' },
  },
  // danger with empty/missing fields (must not crash)
  { riskScore: 88, severity: 'CRITICAL' },
  // safe generic result
  { riskScore: 20, severity: null, status: null },
];

describe('RiskResultCard renders every analyzer result shape without crashing', () => {
  LANGS.forEach((lang) => {
    RESULT_SHAPES.forEach((result, i) => {
      it(`${lang} shape#${i}`, () => {
        expect(() =>
          renderToString(
            React.createElement(RiskResultCard, {
              result,
              currentLang: lang,
              onOpenReport: () => {},
              onMintBlock: () => {},
            })
          )
        ).not.toThrow();
      });
    });
  });
});
