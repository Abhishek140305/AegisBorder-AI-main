import { describe, it, expect } from 'vitest';
import { parseUpiPayload } from '../upiQrDetector';

describe('parseUpiPayload', () => {

  // ── Guard: invalid input ───────────────────────────────────────────────────

  it('returns null for null input', () => {
    expect(parseUpiPayload(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(parseUpiPayload(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseUpiPayload('')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(parseUpiPayload(12345)).toBeNull();
  });

  // ── UPI scheme parsing ─────────────────────────────────────────────────────

  it('parses a valid upi://pay URI', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&pn=TestMerchant');
    expect(result.isUpiScheme).toBe(true);
    expect(result.vpa).toBe('merchant@sbi');
    expect(result.payeeName).toBe('TestMerchant');
  });

  it('extracts the amount when present', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&am=4999');
    expect(result.amount).toBe(4999);
  });

  it('returns null amount when absent', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi');
    expect(result.amount).toBeNull();
  });

  it('extracts the transaction note', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&tn=Payment+for+order+123');
    expect(result.transactionNote).toBe('Payment for order 123');
  });

  it('defaults currency to INR', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi');
    expect(result.currency).toBe('INR');
  });

  it('accepts a custom currency code', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&cu=USD');
    expect(result.currency).toBe('USD');
  });

  // ── Standalone VPA parsing ──────────────────────────────────────────────────

  it('parses a bare VPA string (no upi:// prefix)', () => {
    const result = parseUpiPayload('merchant@sbi');
    expect(result.vpa).toBe('merchant@sbi');
    expect(result.isUpiScheme).toBe(false);
  });

  // ── Cashback / Deceptive intent detection ─────────────────────────────────

  it('flags cashback in VPA as deceptive', () => {
    const result = parseUpiPayload('upi://pay?pa=cashback-claim@ybl&am=4999');
    expect(result.hasDeceptiveIntent).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(90);
  });

  it('flags cashback in payeeName as deceptive', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&pn=Cashback+Reward+Dept');
    expect(result.hasDeceptiveIntent).toBe(true);
  });

  it('flags cashback in transaction note as deceptive', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&tn=Claim+your+cashback+now');
    expect(result.hasDeceptiveIntent).toBe(true);
  });

  it('flags lottery keyword in VPA', () => {
    const result = parseUpiPayload('upi://pay?pa=lottery-prize@bank&am=10000');
    expect(result.hasDeceptiveIntent).toBe(true);
  });

  it('flags reward keyword in payeeName', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&pn=reward-claim-center');
    expect(result.hasDeceptiveIntent).toBe(true);
  });

  it('flags refund keyword', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&pn=Refund+Department');
    expect(result.hasDeceptiveIntent).toBe(true);
  });

  it('flags winner keyword', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&pn=Winner+Prize+Desk');
    expect(result.hasDeceptiveIntent).toBe(true);
  });

  it('flags bonus keyword', () => {
    const result = parseUpiPayload('upi://pay?pa=merchant@sbi&tn=Bonus+ credited');
    expect(result.hasDeceptiveIntent).toBe(true);
  });

  // ── Risk scoring ────────────────────────────────────────────────────────────

  it('assigns riskScore >= 90 for cashback with amount', () => {
    const result = parseUpiPayload('upi://pay?pa=cashback-claim@ybl&am=4999');
    expect(result.riskScore).toBeGreaterThanOrEqual(90);
  });

  it('marks as threat when riskScore >= 70', () => {
    const result = parseUpiPayload('upi://pay?pa=cashback-claim@ybl&am=4999');
    expect(result.isThreat).toBe(true);
  });

  it('marks a legitimate merchant VPA as safe', () => {
    const result = parseUpiPayload('upi://pay?pa=kirana-store@sbi&am=150&pn=Ramesh+Store');
    expect(result.riskScore).toBeLessThan(70);
    expect(result.isThreat).toBe(false);
  });

  // ── Friction message ───────────────────────────────────────────────────────

  it('includes a frictionMessage when threat is detected', () => {
    const result = parseUpiPayload('upi://pay?pa=cashback-claim@ybl&am=4999');
    expect(result.frictionMessage).toBeTruthy();
  });

  it('frictionMessage contains the amount in Hindi when lang=hi', () => {
    const result = parseUpiPayload('upi://pay?pa=cashback-claim@ybl&am=4999');
    // The amount 4999 should appear in the Hindi friction message
    expect(result.frictionMessage.hi).toContain('4999');
  });

  it('frictionMessage contains the amount in English when lang=en', () => {
    const result = parseUpiPayload('upi://pay?pa=cashback-claim@ybl&am=4999');
    expect(result.frictionMessage.en).toContain('4999');
  });

  it('actionType is always DEBIT_PAYMENT', () => {
    const result = parseUpiPayload('upi://pay?pa=cashback-claim@ybl&am=4999');
    expect(result.actionType).toBe('DEBIT_PAYMENT');
  });

  // ── Bloom filter integration ───────────────────────────────────────────────

  it('includes bloomLookupMs in result', () => {
    const result = parseUpiPayload('upi://pay?pa=some-vpa@bank');
    expect(typeof result.bloomLookupMs).toBe('number');
  });

  // ── Known threat VPA ───────────────────────────────────────────────────────

  it('flags a known malicious VPA from bloom filter with riskScore 99', () => {
    const result = parseUpiPayload('upi://pay?pa=cashback-claim@ybl');
    expect(result.riskScore).toBe(99);
  });

  // ── Risk reasons ───────────────────────────────────────────────────────────

  it('populates riskReasons array for threats', () => {
    const result = parseUpiPayload('upi://pay?pa=cashback-claim@ybl&am=4999');
    expect(Array.isArray(result.riskReasons)).toBe(true);
    expect(result.riskReasons.length).toBeGreaterThan(0);
  });
});
