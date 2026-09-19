import React from 'react';
import { AlertOctagon, ArrowUpRight, ArrowDownLeft, Lock, ShieldX, Volume2, X, AlertTriangle } from 'lucide-react';
import { REGIONAL_STRINGS } from '../engine/regionalDictionary';

export default function MicroFrictionModal({ 
  isOpen, 
  onClose, 
  upiDetails, 
  currentLang = 'hi', 
  onPlayVoice 
}) {
  if (!isOpen || !upiDetails) return null;

  const amount = upiDetails.amount || 4999;
  const payee = upiDetails.payeeName || upiDetails.vpa || 'Unknown Receiver';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-lg w-full p-5 sm:p-6 border-red-500 shadow-2xl border-2">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Warning: Money Will Be Deducted!
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                (चेतावनी: आपके खाते से पैसे कटेंगे!)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Warning Banner */}
        <div className="p-4 rounded-xl card-danger mb-4 text-center">
          <div className="badge-danger inline-flex items-center gap-1 mb-2">
            <ShieldX className="w-3.5 h-3.5" />
            <span>Fraudulent Collect Request</span>
          </div>
          <h2 className="text-base font-bold text-red-900 dark:text-red-200 mb-1 leading-snug">
            {REGIONAL_STRINGS.microFrictionTitle[currentLang] || REGIONAL_STRINGS.microFrictionTitle.en}
          </h2>
          <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
            {REGIONAL_STRINGS.microFrictionDesc[currentLang] || REGIONAL_STRINGS.microFrictionDesc.en}
          </p>
        </div>

        {/* Send vs Receive Visual Contrast Box */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          
          {/* What scammer claims */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] opacity-70">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Receiving Money</span>
            </div>
            <div className="text-xs text-[var(--text-muted)] line-through">
              Enter UPI PIN
            </div>
            <div className="mt-2 text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">
              ✓ Receiving money NEVER requires entering your PIN!
            </div>
          </div>

          {/* What will actually happen */}
          <div className="p-3.5 rounded-xl card-danger border-2 border-red-500">
            <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 text-xs font-bold mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>Sending (DEBIT)</span>
            </div>
            <div className="text-base font-bold text-red-900 dark:text-red-200 font-mono">
              - ₹{amount}
            </div>
            <div className="mt-2 text-[10px] text-red-800 dark:text-red-300 font-semibold">
              ⚠️ Will deduct ₹{amount} to: {payee}
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full btn-danger text-sm py-3 justify-center"
          >
            <Lock className="w-4 h-4" />
            <span>Cancel Transaction & Keep My Money Safe</span>
          </button>

          {onPlayVoice && (
            <button
              onClick={onPlayVoice}
              className="w-full btn-secondary text-xs py-2 justify-center"
            >
              <Volume2 className="w-4 h-4 text-[var(--primary)]" />
              <span>Listen in Hindi (आवाज़ में सुनें)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
