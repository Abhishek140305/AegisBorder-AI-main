import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  ShieldAlert, 
  ShieldCheck, 
  Volume2, 
  ExternalLink, 
  Lock, 
  Send, 
  UserX, 
  UserCheck, 
  Sparkles, 
  Wifi, 
  Battery, 
  Signal, 
  Zap,
  ArrowRight,
  AlertTriangle,
  Play
} from 'lucide-react';
import { speakText } from './VoiceAssistant';
import { analyzeMessage } from '../engine/codeMixedNlp';

const SIMULATED_ATTACKS = [
  {
    id: 'sim-electricity',
    sender: '+91 98765 43210',
    senderName: 'Unknown Number (Unsaved)',
    isKnown: false,
    app: 'WhatsApp',
    time: 'Just now',
    text: 'Dear customer aapka bijli bill update nahi hai, aaj raat 9 baje connection cut jayega. Call electricity nodal officer 9876543210 immediately.',
    voiceAlert: 'सावधान! अज्ञात नंबर से बिजली काटने का फर्जी मैसेज आया है। किसी नंबर पर कॉल न करें।'
  },
  {
    id: 'sim-sbi-kyc',
    sender: '+91 87654 32109',
    senderName: 'Unknown SMS Gateway (Unsaved)',
    isKnown: false,
    app: 'SMS Messages',
    time: '2m ago',
    text: 'SBI Alert: Your YONO NetBanking will be suspended today due to pending KYC. Click http://sbi-bank-kyc-update.top to update PAN immediately.',
    voiceAlert: 'चेतावनी! फर्जी बैंक वेबसाइट का लिंक भेजा गया है। इसे न खोलें।'
  },
  {
    id: 'sim-upi-cashback',
    sender: '+91 70012 34567',
    senderName: 'Unknown WhatsApp Sender',
    isKnown: false,
    app: 'WhatsApp',
    time: '5m ago',
    text: 'Congratulations! ₹4,999 Cashback approved on Paytm. Scan QR code and enter UPI PIN to receive money into your bank.',
    voiceAlert: 'रुकिए! पैसे पाने के लिए कभी भी यूपीआई पिन दर्ज न करें।'
  },
  {
    id: 'sim-known-contact',
    sender: '+91 98111 22334',
    senderName: 'Mom (Saved in Phonebook)',
    isKnown: true,
    app: 'WhatsApp',
    time: '10m ago',
    text: 'Beta ghar aate waqt fruits le aana. Check this recipe: https://recipes.com/healthy-salad',
    voiceAlert: 'संदेश आपके सहेजे गए संपर्क से है। स्कैनिंग छोड़ दी गई है।'
  }
];

export default function PhoneSimulator({ 
  currentLang, 
  onTriggerMicroFriction, 
  onOpenSandbox,
  onOpenReport 
}) {
  const [selectedAttack, setSelectedAttack] = useState(SIMULATED_ATTACKS[0]);
  const [isSimulatingIncoming, setIsSimulatingIncoming] = useState(false);
  const [floatingOverlayActive, setFloatingOverlayActive] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(() => 
    analyzeMessage(SIMULATED_ATTACKS[0].text, currentLang, { 
      isKnownContact: SIMULATED_ATTACKS[0].isKnown,
      senderInfo: SIMULATED_ATTACKS[0].senderName
    })
  );

  const handleTriggerIncoming = (attack) => {
    setSelectedAttack(attack);
    setIsSimulatingIncoming(true);
    setFloatingOverlayActive(false);

    // Simulate network delay of incoming WhatsApp notification
    setTimeout(() => {
      setIsSimulatingIncoming(false);
      setFloatingOverlayActive(true);
      const res = analyzeMessage(attack.text, currentLang, {
        isKnownContact: attack.isKnown,
        senderInfo: attack.senderName
      });
      setAnalysisResult(res);

      // Proactively speak audio alert without any user interaction if threat from unknown number
      if (!attack.isKnown && res.isThreat) {
        speakText(attack.voiceAlert, currentLang);
      }
    }, 600);
  };

  return (
    <div className="card p-5 sm:p-6 space-y-6">
      
      {/* Top Banner explaining Automatic Interception */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[var(--primary)] flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span>Automatic Phone Protection Demo (फोन सुरक्षा डेमो)</span>
              <span className="badge-safe text-[10px]">
                Active Shield
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Shows how Rakshak warns you immediately when a scam message arrives on WhatsApp or SMS — without having to copy-paste!
            </p>
          </div>
        </div>

        {/* Live Scenario Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[var(--text-muted)]">Test message:</span>
          {SIMULATED_ATTACKS.map((atk) => (
            <button
              key={atk.id}
              onClick={() => handleTriggerIncoming(atk)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all border flex items-center gap-1.5 ${
                selectedAttack.id === atk.id
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                  : 'bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>{atk.senderName.split(' ')[0]} {atk.isKnown ? '👤' : '⚠️'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout: Phone Mockup & Real-Time Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Mobile Mockup (5 Cols) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[340px] rounded-[36px] bg-slate-900 border-[6px] border-slate-700 shadow-xl overflow-hidden relative font-sans">
            
            {/* Mobile Top Bezel & Status Bar */}
            <div className="h-6 bg-slate-950 flex items-center justify-between px-5 text-[10px] text-slate-400 font-mono select-none">
              <span>09:41</span>
              <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              </div>
              <div className="flex items-center gap-1.5">
                <Signal className="w-3 h-3 text-slate-300" />
                <Wifi className="w-3 h-3 text-emerald-400" />
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* WhatsApp / SMS In-App Header */}
            <div className="bg-[#075E54] text-white p-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  selectedAttack.isKnown ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'
                }`}>
                  {selectedAttack.isKnown ? '👤' : '⚠️'}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight truncate max-w-[150px]">
                    {selectedAttack.sender}
                  </div>
                  <div className="text-[10px] text-emerald-200 opacity-90 flex items-center gap-1 font-sans">
                    {selectedAttack.isKnown ? (
                      <span className="text-emerald-300">✓ Saved in Contacts</span>
                    ) : (
                      <span className="text-amber-200 font-bold">⚠️ Unknown Sender</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rakshak Background Indicator Pill */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/20 text-[9px] text-emerald-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Protected</span>
              </div>
            </div>

            {/* Simulated Chat Message Canvas */}
            <div className="h-[360px] bg-[#0b141a] p-3 flex flex-col justify-end space-y-3 overflow-y-auto relative">
              
              {/* Incoming Message Bubble */}
              <div className={`max-w-[88%] p-3 rounded-2xl rounded-tl-sm text-xs leading-relaxed shadow-lg relative ${
                selectedAttack.isKnown
                  ? 'bg-[#1f2c34] text-slate-200 border border-slate-700/60'
                  : 'bg-[#2a1215] text-red-100 border border-red-500/40'
              }`}>
                {!selectedAttack.isKnown && (
                  <div className="text-[10px] text-red-400 font-bold mb-1 flex items-center gap-1">
                    <UserX className="w-3 h-3" />
                    <span>Unknown Number ({selectedAttack.sender})</span>
                  </div>
                )}

                <p className="font-sans text-[11px] leading-relaxed">
                  {selectedAttack.text}
                </p>

                <div className="text-[9px] text-slate-400 text-right mt-1 font-sans">
                  {selectedAttack.time}
                </div>
              </div>

              {/* ZERO-CLICK FLOATING SYSTEM ALERT BUBBLE */}
              {floatingOverlayActive && !selectedAttack.isKnown && analysisResult.isThreat && (
                <div className="p-3 rounded-2xl bg-red-950 border-2 border-red-500 text-white shadow-2xl z-20">
                  <div className="flex items-center justify-between pb-1.5 border-b border-red-500/40 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span className="text-[11px] font-bold text-red-300 uppercase">
                        Rakshak Safety Warning
                      </span>
                    </div>
                    <span className="text-[9px] text-red-300 bg-red-900 px-1.5 py-0.5 rounded font-semibold">
                      Auto-Detected
                    </span>
                  </div>

                  <p className="text-[11px] text-white font-semibold leading-snug mb-2">
                    {analysisResult.title}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => speakText(selectedAttack.voiceAlert, currentLang)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen (आवाज़ सुनें)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PRIVACY BYPASS BANNER IF KNOWN CONTACT */}
              {floatingOverlayActive && selectedAttack.isKnown && (
                <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Privacy Protected:</strong> Saved family contact.
                  </span>
                </div>
              )}

            </div>

            {/* Mobile Bottom Home Bar */}
            <div className="h-5 bg-slate-950 flex items-center justify-center">
              <div className="w-24 h-1 bg-slate-700 rounded-full" />
            </div>

          </div>
        </div>

        {/* Right: How It Protects You In Real Life (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="p-4 rounded-xl card bg-[var(--bg-surface-subtle)] space-y-3">
            <h4 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>How Automatic Protection Works (बिना कॉपी-पेस्ट किए)</span>
            </h4>

            <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
              <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[var(--primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="font-bold text-[var(--text-primary)]">
                    Scam message arrives on phone
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    When an SMS or WhatsApp notification arrives, Rakshak AI checks if the sender is in your address book.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[var(--primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="font-bold text-[var(--text-primary)]">
                    Instant On-Device Check (Sub-2ms)
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    If the sender is <strong>Unknown</strong>, Rakshak scans Hindi & English words and links entirely inside your phone.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[var(--primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <div className="font-bold text-[var(--text-primary)]">
                    Spoken Hindi Voice Warning
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    An immediate voice alert speaks out loud so parents and grandparents know not to click fake links.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Telemetry Card */}
          <div className="p-4 rounded-xl card bg-[var(--bg-surface)] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase">
                Active Scenario Details
              </span>
              <span className={selectedAttack.isKnown ? 'badge-safe' : 'badge-danger'}>
                {selectedAttack.isKnown ? '✓ Saved Contact' : '⚠️ Unknown Number'}
              </span>
            </div>

            <div className="text-sm text-[var(--text-primary)] font-bold">
              {analysisResult.title}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {typeof analysisResult.explanation === 'object'
                ? (analysisResult.explanation[currentLang] || analysisResult.explanation.en)
                : analysisResult.explanation}
            </p>

            <div className="pt-2">
              <button
                onClick={() => speakText(selectedAttack.voiceAlert, currentLang)}
                className="btn-primary text-xs"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hear Voice Warning (आवाज़ में सुनें)</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
