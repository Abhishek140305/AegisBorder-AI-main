// On-device compressed Bloom filter (mirrors web app src/engine/bloomFilter.js)
import { knownThreats } from './data.js';

class LocalBloomFilter {
  constructor(size = 100000, hashCount = 3) {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Uint8Array(Math.ceil(size / 8));
    this.itemCount = 0;
    this.initDefaultDataset();
  }

  _hashes(string) {
    const s = String(string).trim().toLowerCase();
    let h1 = 5381;
    let h2 = 2166136261;
    let h3 = 1000003;
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      h1 = ((h1 << 5) + h1) + char;
      h2 = (h2 ^ char) * 16777619;
      h3 = ((h3 << 7) - h3) + char;
    }
    return [
      Math.abs(h1) % this.size,
      Math.abs(h2) % this.size,
      Math.abs(h1 ^ h2 ^ h3) % this.size
    ];
  }

  add(item) {
    if (!item) return;
    const indices = this._hashes(item);
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitIdx = idx % 8;
      this.bitArray[byteIdx] |= (1 << bitIdx);
    }
    this.itemCount++;
  }

  contains(item) {
    if (!item) return { match: false, lookupTimeMs: 0 };
    const startTime = performance.now();
    const indices = this._hashes(item);
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitIdx = idx % 8;
      if ((this.bitArray[byteIdx] & (1 << bitIdx)) === 0) {
        return { match: false, lookupTimeMs: +(performance.now() - startTime).toFixed(3) };
      }
    }
    return { match: true, lookupTimeMs: +(performance.now() - startTime).toFixed(3) };
  }

  initDefaultDataset() {
    knownThreats.domains.forEach((d) => this.add(d));
    knownThreats.vpas.forEach((v) => this.add(v));
  }
}

export const bloomFilter = new LocalBloomFilter();
