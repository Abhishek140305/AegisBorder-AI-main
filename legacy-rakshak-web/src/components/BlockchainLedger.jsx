import React, { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, Lock, Plus, Sparkles, Hash, Layers, Users, X } from 'lucide-react';
import { CONSORTIUM_NODES, globalPoaBlockchain } from '../engine/poaBlockchainSim';
import confetti from 'canvas-confetti';

export default function BlockchainLedger({ isOpen, onClose }) {
  const [blocks, setBlocks] = useState(() => globalPoaBlockchain.getBlocks());
  const [targetInput, setTargetInput] = useState('');
  const [typeInput, setTypeInput] = useState('PHISHING_DOMAIN');
  const [detailsInput, setDetailsInput] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  if (!isOpen) return null;

  const handleMint = (e) => {
    e.preventDefault();
    if (!targetInput.trim()) return;

    setIsMinting(true);
    setTimeout(() => {
      globalPoaBlockchain.submitCommunityReport(
        targetInput,
        typeInput,
        detailsInput || 'Verified malicious pattern reported by community'
      );
      setBlocks([...globalPoaBlockchain.getBlocks()]);
      setIsMinting(false);
      setTargetInput('');
      setDetailsInput('');

      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 }
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-3xl w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[var(--primary)] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>Verified Scam Registry (सत्यापित फ्रॉड डेटाबेस)</span>
                <span className="badge-safe text-[10px]">
                  Cyber Police 1930
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Shared in real-time across Indian Cyber Crime Units, RBI Banks & Telecom Providers
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-5 pr-1 text-xs">
          
          {/* Consortium Nodes Bar */}
          <div className="p-4 rounded-xl card bg-[var(--bg-surface-subtle)]">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[var(--primary)]" />
                <span>Authorized Verifiers (3/3 Active)</span>
              </h4>
              <span className="text-[11px] text-[var(--text-muted)]">Rule: &gt;= 2 Signatures Required</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {CONSORTIUM_NODES.map((node) => (
                <div key={node.id} className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <span className="text-lg">{node.avatar}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-[var(--text-primary)] truncate">{node.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{node.nodeType}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit New Scam Record Form */}
          <div className="p-4 rounded-xl card bg-[var(--bg-surface-subtle)]">
            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[var(--primary)]" />
              <span>Report Known Scam to National Database</span>
            </h4>

            <form onSubmit={handleMint} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="Scam link or UPI ID (e.g. scam-paytm@ybl)"
                  className="sm:col-span-2 p-2.5 rounded-lg input-clean text-xs font-mono"
                  required
                />
                <select
                  value={typeInput}
                  onChange={(e) => setTypeInput(e.target.value)}
                  className="p-2.5 rounded-lg input-clean text-xs text-[var(--text-primary)]"
                >
                  <option value="PHISHING_DOMAIN">Fake Website Link</option>
                  <option value="DECEPTIVE_UPI_VPA">Fake UPI Cashback ID</option>
                  <option value="RAT_MALWARE_APK">Dangerous Spy APK</option>
                  <option value="SMS_SPOOF_SOURCE">SMS Spoof Sender</option>
                </select>
              </div>

              <input
                type="text"
                value={detailsInput}
                onChange={(e) => setDetailsInput(e.target.value)}
                placeholder="Details of the scam message or incident"
                className="w-full p-2.5 rounded-lg input-clean text-xs"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isMinting || !targetInput.trim()}
                  className="btn-primary text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isMinting ? 'Verifying & Saving...' : 'Save to Official Database'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Verified Scam Records List */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Verified Scam Records ({blocks.length} Recorded)</span>
            </h4>

            <div className="space-y-2">
              {blocks.map((block) => (
                <div 
                  key={block.blockNumber} 
                  className="p-3.5 rounded-xl card bg-[var(--bg-surface)] hover:border-[var(--border-medium)] transition-all"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)] mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--primary)]">
                        Record #{block.blockNumber}
                      </span>
                      <span className="badge-danger text-[10px]">
                        {block.threatType}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(block.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="font-semibold text-[var(--text-primary)] mb-1">
                    Target: <span className="font-mono text-red-600 dark:text-red-400">{block.threatTarget}</span>
                  </div>

                  {block.evidenceDetails && (
                    <div className="text-[11px] text-[var(--text-secondary)] mb-2">
                      {block.evidenceDetails}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                    <span className="font-mono">Hash: {block.blockHash.slice(0, 14)}...</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ Verified by RBI & Cyber Police</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border-subtle)] mt-3 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Close Registry
          </button>
        </div>

      </div>
    </div>
  );
}
