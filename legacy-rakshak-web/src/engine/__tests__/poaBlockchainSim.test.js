import { describe, it, expect, beforeEach } from 'vitest';
import { PoABlockchain, CONSORTIUM_NODES, simpleHash } from '../poaBlockchainSim';

describe('simpleHash', () => {

  it('returns a hex string starting with 0x', () => {
    const hash = simpleHash('test input');
    expect(hash).toMatch(/^0x[0-9a-f]+$/i);
  });

  it('returns the same hash for the same input', () => {
    const h1 = simpleHash('consortium-block');
    const h2 = simpleHash('consortium-block');
    expect(h1).toBe(h2);
  });

  it('returns different hashes for different inputs', () => {
    const h1 = simpleHash('input-a');
    const h2 = simpleHash('input-b');
    expect(h1).not.toBe(h2);
  });

  it('produces a 32-character hex string (16 bytes)', () => {
    const hash = simpleHash('test');
    // 0x + 32 hex chars = 34 total
    expect(hash.length).toBe(34);
  });
});

describe('CONSORTIUM_NODES', () => {

  it('exports exactly 3 validator nodes', () => {
    expect(CONSORTIUM_NODES).toHaveLength(3);
  });

  it('each node has an id, name, pubKey, nodeType, and status', () => {
    CONSORTIUM_NODES.forEach(node => {
      expect(node.id).toBeTruthy();
      expect(node.name).toBeTruthy();
      expect(node.pubKey).toMatch(/^0x/);
      expect(node.nodeType).toBeTruthy();
      expect(node.status).toBeTruthy();
    });
  });

  it('node 1 is the National Cyber Crime Cell', () => {
    expect(CONSORTIUM_NODES[0].id).toBe('NODE_CYBER_CELL');
    expect(CONSORTIUM_NODES[0].nodeType).toContain('Law Enforcement');
  });

  it('node 2 is the Partner Banking Consortium', () => {
    expect(CONSORTIUM_NODES[1].id).toBe('NODE_RBI_BANK');
    expect(CONSORTIUM_NODES[1].nodeType).toContain('Financial');
  });

  it('node 3 is the Telecom Fraud Division', () => {
    expect(CONSORTIUM_NODES[2].id).toBe('NODE_TELECOM_AUTH');
    expect(CONSORTIUM_NODES[2].nodeType).toContain('Carrier');
  });

  it('all nodes are marked as ACTIVE_VALIDATOR', () => {
    CONSORTIUM_NODES.forEach(node => {
      expect(node.status).toBe('ACTIVE_VALIDATOR');
    });
  });
});

describe('PoABlockchain — constructor & genesis', () => {
  let chain;

  beforeEach(() => {
    chain = new PoABlockchain();
    // Reset to only the genesis block for these tests
    chain.chain = [chain.createGenesisBlock()];
  });

  it('starts with a genesis block at index 0', () => {
    expect(chain.chain[0].blockNumber).toBe(0);
  });

  it('genesis block has GENESIS_CONSORTIUM_ROOT as threatTarget', () => {
    expect(chain.chain[0].threatTarget).toBe('GENESIS_CONSORTIUM_ROOT');
  });

  it('genesis block is marked CONSENSUS_REACHED', () => {
    expect(chain.chain[0].consensusStatus).toBe('CONSENSUS_REACHED');
  });

  it('genesis block has 3 signatures from all validator nodes', () => {
    // The hard-coded genesis has 3 signatures (one per validator)
    expect(chain.chain[0].signatures).toHaveLength(3);
  });

  it('genesis block is immune to poisoning', () => {
    expect(chain.chain[0].isImmuneToPoisoning).toBe(true);
  });

  it('minimumSignaturesRequired is 2', () => {
    expect(chain.minimumSignaturesRequired).toBe(2);
  });
});

describe('PoABlockchain — initDefaultLedger (pre-minted threats)', () => {
  let chain;

  beforeEach(() => {
    chain = new PoABlockchain();
  });

  it('pre-mints 3 threat blocks after genesis (4 total)', () => {
    // genesis + 3 pre-minted = 4 blocks
    expect(chain.chain.length).toBe(4);
  });

  it('pre-mints sbi-bank-kyc-update.top as PHISHING_DOMAIN', () => {
    const phishingBlock = chain.chain.find(b => b.threatTarget === 'sbi-bank-kyc-update.top');
    expect(phishingBlock).toBeTruthy();
    expect(phishingBlock.threatType).toBe('PHISHING_DOMAIN');
  });

  it('pre-mints cashback-claim@ybl as DECEPTIVE_UPI_VPA', () => {
    const upiBlock = chain.chain.find(b => b.threatTarget === 'cashback-claim@ybl');
    expect(upiBlock).toBeTruthy();
    expect(upiBlock.threatType).toBe('DECEPTIVE_UPI_VPA');
  });

  it('pre-mints AnyDesk APK as RAT_MALWARE_APK', () => {
    const apkBlock = chain.chain.find(b => b.threatTarget.includes('AnyDesk_Support.apk'));
    expect(apkBlock).toBeTruthy();
    expect(apkBlock.threatType).toBe('RAT_MALWARE_APK');
  });
});

describe('PoABlockchain — addVerifiedBlock', () => {
  let chain;

  beforeEach(() => {
    chain = new PoABlockchain();
    chain.chain = [chain.createGenesisBlock()]; // reset to just genesis
  });

  it('adds a new block to the chain', () => {
    const before = chain.chain.length;
    chain.addVerifiedBlock('test-scam.xyz', 'PHISHING_DOMAIN', 'Test evidence');
    expect(chain.chain.length).toBe(before + 1);
  });

  it('new block has CONSENSUS_REACHED status', () => {
    const block = chain.addVerifiedBlock('test-scam.xyz', 'PHISHING_DOMAIN', 'Test');
    expect(block.consensusStatus).toBe('CONSENSUS_REACHED');
  });

  it('new block requires 2 signatures', () => {
    const block = chain.addVerifiedBlock('test-scam.xyz', 'PHISHING_DOMAIN', 'Test');
    expect(block.requiredSignatures).toBe(2);
  });

  it('new block has exactly 2 signatures (Cyber Cell + RBI Bank)', () => {
    const block = chain.addVerifiedBlock('test-scam.xyz', 'PHISHING_DOMAIN', 'Test');
    expect(block.signatures).toHaveLength(2);
    expect(block.signatures[0].nodeId).toBe('NODE_CYBER_CELL');
    expect(block.signatures[1].nodeId).toBe('NODE_RBI_BANK');
  });

  it('new block includes the threatTarget', () => {
    const block = chain.addVerifiedBlock('malicious-vpa@ybl', 'DECEPTIVE_UPI_VPA', 'Evidence');
    expect(block.threatTarget).toBe('malicious-vpa@ybl');
  });

  it('new block includes the threatType', () => {
    const block = chain.addVerifiedBlock('test.top', 'PHISHING_DOMAIN', 'Evidence');
    expect(block.threatType).toBe('PHISHING_DOMAIN');
  });

  it('new block includes evidenceDetails', () => {
    const block = chain.addVerifiedBlock('test.top', 'PHISHING_DOMAIN', 'Detailed evidence here');
    expect(block.evidenceDetails).toBe('Detailed evidence here');
  });

  it('new block has a previousHash linking to the prior block', () => {
    const block = chain.addVerifiedBlock('test.top', 'PHISHING_DOMAIN', 'Evidence');
    expect(block.previousHash).toBeTruthy();
    expect(block.previousHash).toMatch(/^0x/);
  });

  it('new block has a blockHash', () => {
    const block = chain.addVerifiedBlock('test.top', 'PHISHING_DOMAIN', 'Evidence');
    expect(block.blockHash).toMatch(/^0x/);
  });

  it('block numbers are sequential starting from 1', () => {
    const b1 = chain.addVerifiedBlock('first.top', 'PHISHING_DOMAIN', 'First');
    const b2 = chain.addVerifiedBlock('second.top', 'PHISHING_DOMAIN', 'Second');
    expect(b1.blockNumber).toBe(1);
    expect(b2.blockNumber).toBe(2);
  });

  it('new blocks are prepended to the chain (latest first)', () => {
    chain.addVerifiedBlock('first.top', 'PHISHING_DOMAIN', 'First');
    chain.addVerifiedBlock('second.top', 'PHISHING_DOMAIN', 'Second');
    expect(chain.chain[0].threatTarget).toBe('second.top');
    expect(chain.chain[1].threatTarget).toBe('first.top');
  });

  it('isImmuneToPoisoning is true on all new blocks', () => {
    const block = chain.addVerifiedBlock('test.top', 'PHISHING_DOMAIN', 'Evidence');
    expect(block.isImmuneToPoisoning).toBe(true);
  });
});

describe('PoABlockchain — submitCommunityReport', () => {
  let chain;

  beforeEach(() => {
    chain = new PoABlockchain();
    chain.chain = [chain.createGenesisBlock()];
  });

  it('returns a report object with PENDING_CONSORTIUM_VALIDATION status', () => {
    const { report } = chain.submitCommunityReport('scam-vpa@ybl', 'DECEPTIVE_UPI_VPA', 'Community tip');
    expect(report.status).toBe('PENDING_CONSORTIUM_VALIDATION');
  });

  it('returns a mintedBlock along with the report', () => {
    const { mintedBlock } = chain.submitCommunityReport('scam-vpa@ybl', 'DECEPTIVE_UPI_VPA', 'Community tip');
    expect(mintedBlock).toBeTruthy();
    expect(mintedBlock.consensusStatus).toBe('CONSENSUS_REACHED');
  });

  it('increments the chain length', () => {
    const before = chain.chain.length;
    chain.submitCommunityReport('vpa@ybl', 'DECEPTIVE_UPI_VPA', 'Report');
    expect(chain.chain.length).toBe(before + 1);
  });

  it('report includes a generated reportId', () => {
    const { report } = chain.submitCommunityReport('vpa@ybl', 'DECEPTIVE_UPI_VPA', 'Details');
    expect(report.reportId).toMatch(/^REP-\d{6}$/);
  });
});

describe('PoABlockchain — getBlocks', () => {
  it('returns the full chain', () => {
    const chain = new PoABlockchain();
    const blocks = chain.getBlocks();
    expect(blocks).toBe(chain.chain);
    expect(blocks.length).toBeGreaterThanOrEqual(4); // genesis + 3 pre-minted
  });
});

describe('PoABlockchain — Sybil protection invariants', () => {

  it('no block can be added without at least 2 signatures', () => {
    const chain = new PoABlockchain();
    chain.chain = [chain.createGenesisBlock()];
    const block = chain.addVerifiedBlock('test.top', 'PHISHING_DOMAIN', 'Evidence');
    expect(block.actualSignatures).toBeGreaterThanOrEqual(2);
  });

  it('all blocks in the default ledger have >= 2 signatures', () => {
    const chain = new PoABlockchain();
    chain.chain.forEach(block => {
      expect(block.signatures.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('all blocks are marked as immune to poisoning', () => {
    const chain = new PoABlockchain();
    chain.chain.forEach(block => {
      expect(block.isImmuneToPoisoning).toBe(true);
    });
  });

  it('actual signatures meets or exceeds minimum required', () => {
    const chain = new PoABlockchain();
    chain.chain.forEach(block => {
      if (block.blockNumber > 0) { // skip genesis
        expect(block.actualSignatures).toBeGreaterThanOrEqual(block.requiredSignatures);
      }
    });
  });
});
