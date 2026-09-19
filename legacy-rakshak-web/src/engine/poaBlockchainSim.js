// Proof-of-Authority (PoA) Consortium Blockchain Engine
// Multi-Signature verification to prevent Sybil & Fraud Reporting Poisoning

export const CONSORTIUM_NODES = [
  {
    id: "NODE_CYBER_CELL",
    name: "National Cyber Crime Reporting Cell (I4C / MHA)",
    nodeType: "Law Enforcement Authority",
    pubKey: "0x8F92a1B73c49D8E042",
    avatar: "🛡️",
    status: "ACTIVE_VALIDATOR",
    endpoint: "cybercell-node-01.gov.in"
  },
  {
    id: "NODE_RBI_BANK",
    name: "Partner Banking Consortium (RBI / NPCI Security)",
    nodeType: "Financial Settlement Gateway",
    pubKey: "0x3A64b8C91d28F3A199",
    avatar: "🏦",
    status: "ACTIVE_VALIDATOR",
    endpoint: "rbi-consortium-node-04.npci.org.in"
  },
  {
    id: "NODE_TELECOM_AUTH",
    name: "Telecom Fraud Intelligence Unit (DoT / TAFCOP)",
    nodeType: "Carrier & SMS Routing Gate",
    pubKey: "0x7C51d9A20e83C4B841",
    avatar: "📡",
    status: "ACTIVE_VALIDATOR",
    endpoint: "telecom-tafcop-node-02.dot.gov.in"
  }
];

// Helper to compute simulated SHA-256 hash
export function simpleHash(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return "0x" + Math.abs(hash).toString(16).padStart(16, '0') + Math.abs(hash * 31).toString(16).padStart(16, '0');
}

export class PoABlockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingThreatReports = [];
    this.minimumSignaturesRequired = 2;
    this.initDefaultLedger();
  }

  createGenesisBlock() {
    return {
      blockNumber: 0,
      timestamp: "2026-01-01T00:00:00.000Z",
      threatTarget: "GENESIS_CONSORTIUM_ROOT",
      threatType: "SYSTEM_INITIALIZATION",
      evidenceHash: "0x00000000000000000000000000000000",
      previousHash: "0x00000000000000000000000000000000",
      blockHash: "0x89ab12cd34ef567890abcdef12345678",
      signatures: [
        { nodeId: "NODE_CYBER_CELL", pubKey: CONSORTIUM_NODES[0].pubKey, signedAt: "2026-01-01T00:00:00.000Z" },
        { nodeId: "NODE_RBI_BANK", pubKey: CONSORTIUM_NODES[1].pubKey, signedAt: "2026-01-01T00:00:00.000Z" },
        { nodeId: "NODE_TELECOM_AUTH", pubKey: CONSORTIUM_NODES[2].pubKey, signedAt: "2026-01-01T00:00:00.000Z" }
      ],
      consensusStatus: "CONSENSUS_REACHED",
      isImmuneToPoisoning: true
    };
  }

  initDefaultLedger() {
    // Mint 3 pre-existing verified malicious threat blocks
    this.addVerifiedBlock(
      "sbi-bank-kyc-update.top",
      "PHISHING_DOMAIN",
      "Levenshtein spoofing of sbi.co.in detected by I4C and Bank honeypots."
    );
    this.addVerifiedBlock(
      "cashback-claim@ybl",
      "DECEPTIVE_UPI_VPA",
      "Fraudulent collect request targeting ₹4,999 from rural UPI wallets."
    );
    this.addVerifiedBlock(
      "http://customer-support-app.net/AnyDesk_Support.apk",
      "RAT_MALWARE_APK",
      "Contains BIND_ACCESSIBILITY_SERVICE and READ_SMS OTP interception."
    );
  }

  addVerifiedBlock(threatTarget, threatType, evidenceDetails) {
    const prevBlock = this.chain[this.chain.length - 1];
    const timestamp = new Date().toISOString();
    const evidenceHash = simpleHash(threatTarget + evidenceDetails + timestamp);

    // Collect at least 2 validator multi-signatures
    const signatures = [
      {
        nodeId: CONSORTIUM_NODES[0].id,
        nodeName: CONSORTIUM_NODES[0].name,
        pubKey: CONSORTIUM_NODES[0].pubKey,
        signedAt: timestamp
      },
      {
        nodeId: CONSORTIUM_NODES[1].id,
        nodeName: CONSORTIUM_NODES[1].name,
        pubKey: CONSORTIUM_NODES[1].pubKey,
        signedAt: timestamp
      }
    ];

    const blockHash = simpleHash(
      this.chain.length + prevBlock.blockHash + threatTarget + evidenceHash + timestamp
    );

    const newBlock = {
      blockNumber: this.chain.length,
      timestamp,
      threatTarget,
      threatType,
      evidenceDetails,
      evidenceHash,
      previousHash: prevBlock.blockHash,
      blockHash,
      signatures,
      consensusStatus: "CONSENSUS_REACHED",
      requiredSignatures: this.minimumSignaturesRequired,
      actualSignatures: signatures.length,
      isImmuneToPoisoning: true
    };

    this.chain.unshift(newBlock); // Latest block first for UI
    return newBlock;
  }

  submitCommunityReport(target, type, details) {
    // Sybil protection: An unverified community report must undergo multi-sig consensus
    const timestamp = new Date().toISOString();
    const report = {
      reportId: "REP-" + Math.floor(100000 + Math.random() * 900000),
      target,
      type,
      details,
      timestamp,
      status: "PENDING_CONSORTIUM_VALIDATION"
    };

    // Auto simulate consensus validation after multi-sig approval
    const verifiedBlock = this.addVerifiedBlock(target, type, `Community report verified by Consortium: ${details}`);
    return { report, mintedBlock: verifiedBlock };
  }

  getBlocks() {
    return this.chain;
  }
}

export const globalPoaBlockchain = new PoABlockchain();
