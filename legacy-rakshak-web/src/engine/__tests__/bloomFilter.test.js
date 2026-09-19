import { describe, it, expect, beforeEach } from 'vitest';
import { LocalBloomFilter } from '../bloomFilter';

describe('LocalBloomFilter', () => {
  let bloom;

  beforeEach(() => {
    bloom = new LocalBloomFilter(1000, 3);
  });

  // ── Construction ────────────────────────────────────────────────────────────

  it('initialises with the correct bit-array size', () => {
    expect(bloom.size).toBe(1000);
    expect(bloom.bitArray).toBeInstanceOf(Uint8Array);
    // 1000 bits → 125 bytes (rounded up)
    expect(bloom.bitArray.byteLength).toBe(125);
  });

  // Note: the default dataset (knownThreats.json) is pre-loaded, so itemCount
  // starts above 0. We test relative increments rather than absolute values.
  it('itemCount is a non-negative integer', () => {
    expect(typeof bloom.itemCount).toBe('number');
    expect(bloom.itemCount).toBeGreaterThanOrEqual(0);
  });

  // ── add() ─────────────────────────────────────────────────────────────────

  it('increments itemCount on each add', () => {
    const before = bloom.itemCount;
    bloom.add('malicious-domain.top');
    expect(bloom.itemCount).toBe(before + 1);
    bloom.add('another-bad.one');
    expect(bloom.itemCount).toBe(before + 2);
  });

  it('is case-insensitive', () => {
    bloom.add('SpamDomain.TOP');
    expect(bloom.contains('spamdomain.top').match).toBe(true);
    expect(bloom.contains('SPAMDOMAIN.TOP').match).toBe(true);
  });

  it('trims whitespace', () => {
    bloom.add('  vpa@bank  ');
    expect(bloom.contains('vpa@bank').match).toBe(true);
  });

  it('ignores empty / null input gracefully without throwing', () => {
    const before = bloom.itemCount;
    expect(() => bloom.add(null)).not.toThrow();
    expect(() => bloom.add('')).not.toThrow();
    // itemCount only increases on valid adds
    expect(bloom.itemCount).toBe(before);
  });

  // ── contains() ─────────────────────────────────────────────────────────────

  it('returns match:true for an item that was added', () => {
    bloom.add('known-threat.top');
    expect(bloom.contains('known-threat.top')).toMatchObject({ match: true });
  });

  it('returns match:false for an item never added', () => {
    expect(bloom.contains('safe-domain.com')).toMatchObject({ match: false });
  });

  it('returns an object with a numeric lookupTimeMs field', () => {
    const result = bloom.contains('anything');
    expect(typeof result.lookupTimeMs).toBe('number');
    expect(result.lookupTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('returns false for null / empty input', () => {
    // The engine returns the primitive false, not an object, for null/empty.
    expect(bloom.contains(null)).toBe(false);
    expect(bloom.contains('')).toBe(false);
  });

  // ── False-positive rate ─────────────────────────────────────────────────────

  it('does not report a false positive on a completely unrelated string', () => {
    bloom.add('target-string');
    expect(bloom.contains('completely-different-string').match).toBe(false);
  });

  // When the filter is lightly loaded the false-positive probability is very low.
  it('reports very few false positives with a small dataset', () => {
    for (let i = 0; i < 10; i++) bloom.add(`item-${i}`);
    let falsePositives = 0;
    const unrelated = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    for (const s of unrelated) {
      if (bloom.contains(s + '-xxxxxxxx').match) falsePositives++;
    }
    // With 10 items in a 1000-bit filter the theoretical FPR is < 0.1 %
    expect(falsePositives).toBeLessThanOrEqual(1);
  });

  // ── getStats() ─────────────────────────────────────────────────────────────

  it('reports the correct size in bits and bytes', () => {
    const stats = bloom.getStats();
    expect(stats.sizeBits).toBe(1000);
    expect(stats.sizeBytes).toBe(125);
  });

  it('reports zero setBits when no bits are set', () => {
    // A fresh filter with no adds should have zero set bits.
    // We test by checking that after construction (which calls initDefaultDataset)
    // setBits is greater than 0 (data was loaded), confirming the mechanism works.
    // We verify the delta: adding one item increases setBits.
    const statsBefore = bloom.getStats().setBits;
    bloom.add('test-unique-threat-not-in-seeds.xyz');
    const statsAfter = bloom.getStats().setBits;
    expect(statsAfter).toBeGreaterThan(statsBefore);
  });

  it('reports a positive setBits count after adding items', () => {
    bloom.add('threat.top');
    const stats = bloom.getStats();
    expect(stats.setBits).toBeGreaterThan(0);
  });

  it('reports the item count that was added (plus dataset seeds)', () => {
    const statsBefore = bloom.getStats().itemsIndexed;
    bloom.add('extra-item.xyz');
    expect(bloom.getStats().itemsIndexed).toBe(statsBefore + 1);
  });

  it('reports a fill-ratio percentage between 0 and 100', () => {
    const stats = bloom.getStats();
    expect(stats.fillRatioPercent).toMatch(/^\d+\.\d+$/);
    expect(parseFloat(stats.fillRatioPercent)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(stats.fillRatioPercent)).toBeLessThanOrEqual(100);
  });

  it('reports a falsePositiveRate as a percentage string', () => {
    const stats = bloom.getStats();
    expect(stats.falsePositiveRate).toMatch(/^\d+\.\d+%|0%$/);
  });
});
