import React, { useState, useEffect, useCallback } from 'react';

import Sidebar, { MobileMenuButton } from './components/Sidebar';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import HomeDashboard from './components/HomeDashboard';
import MessageScanner from './components/MessageScanner';
import UrlScanner from './components/UrlScanner';
import QrScanner from './components/QrScanner';
import ApkPermScanner from './components/ApkPermScanner';
import ScamRegistry from './components/ScamRegistry';
import MorePanel from './components/MorePanel';
import ScamExamplePanel from './components/ScamExamplePanel';

import { globalBloomFilter } from './engine/bloomFilter';
import { globalPoaBlockchain } from './engine/poaBlockchainSim';
import { speakText } from './components/VoiceAssistant';

import NotificationSimulator from './components/NotificationSimulator';
import MicroFrictionModal from './components/MicroFrictionModal';
import SafeSandboxModal from './components/SafeSandboxModal';
import IncidentReportModal from './components/IncidentReportModal';
import BlockchainLedger from './components/BlockchainLedger';

const TAB_TITLES = {
  home: 'Home',
  message: 'Message Scanner',
  url: 'Website Checker',
  qr: 'QR & UPI Safety',
  apk: 'App Safety',
  registry: 'Scam Registry',
  more: 'More',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('rakshak_theme') || 'dark');
  const [currentLang, setCurrentLang] = useState(() => localStorage.getItem('rakshak_lang') || 'hi');
  const [searchQuery, setSearchQuery] = useState('');

  /* Modal stack */
  const [activeNotification, setActiveNotification] = useState(null);
  const [microFrictionUpi, setMicroFrictionUpi] = useState(null);
  const [sandboxThreat, setSandboxThreat] = useState(null);
  const [reportThreat, setReportThreat] = useState(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [activeScamExample, setActiveScamExample] = useState(null);

  /* Preset inputs from “demo scenarios” — kept for backwards compatibility */
  const [messageInitialText, setMessageInitialText] = useState('');

  /* Persist prefs */
  useEffect(() => {
    if (theme === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
    localStorage.setItem('rakshak_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('rakshak_lang', currentLang);
  }, [currentLang]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  /* Scan → mint a block + add to bloom filter (real functionality) */
  const handleMintFromThreat = useCallback((threat) => {
    const target = threat.domain || threat.vpa || threat.appName || threat.fullUrl || 'Unknown target';
    const type = threat.category || (threat.isApk ? 'RAT_MALWARE_APK' : threat.vpa ? 'DECEPTIVE_UPI_VPA' : 'PHISHING_DOMAIN');
    globalPoaBlockchain.addVerifiedBlock(
      target,
      type,
      `Reported via Rakshak AI Client Engine. Forensic score: ${threat.riskScore}/100.`
    );
    globalBloomFilter.add(target);
    setIsLedgerOpen(true);
  }, []);

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        currentLang={currentLang}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar row */}
        <div className="flex items-center gap-2 bg-[var(--bg-app)] px-2 sm:px-0">
          <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
          <div className="flex-1 min-w-0">
            <TopBar
              activeTab={activeTab}
              currentLang={currentLang}
              onLanguageChange={setCurrentLang}
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenLedger={() => { setActiveTab('registry'); setIsLedgerOpen(true); }}
              onOpenSettings={() => setActiveTab('more')}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-4">
            {/* Page title for non-home tabs */}
            {activeTab !== 'home' && activeTab !== 'more' && activeTab !== 'registry' && (
              <header className="mb-1">
                <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">{TAB_TITLES[activeTab]}</h1>
                <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5">{getTabSubtitle(activeTab)}</p>
              </header>
            )}

            {activeTab === 'home' && (
              <HomeDashboard
                onTabChange={setActiveTab}
                onOpenScamExample={setActiveScamExample}
                currentLang={currentLang}
              />
            )}

            {activeTab === 'message' && (
              <MessageScanner
                currentLang={currentLang}
                onOpenReport={(t) => setReportThreat(t)}
                onMintBlock={handleMintFromThreat}
                initialText={messageInitialText}
              />
            )}

            {activeTab === 'url' && (
              <UrlScanner
                currentLang={currentLang}
                onOpenReport={(t) => setReportThreat(t)}
                onMintBlock={handleMintFromThreat}
                onOpenSandbox={(t) => setSandboxThreat(t)}
              />
            )}

            {activeTab === 'qr' && (
              <QrScanner
                currentLang={currentLang}
                onOpenReport={(t) => setReportThreat(t)}
                onMintBlock={handleMintFromThreat}
                onTriggerMicroFriction={(u) => setMicroFrictionUpi(u)}
              />
            )}

            {activeTab === 'apk' && (
              <ApkPermScanner
                currentLang={currentLang}
                onOpenReport={(t) => setReportThreat(t)}
                onMintBlock={handleMintFromThreat}
              />
            )}

            {activeTab === 'registry' && <ScamRegistry />}

            {activeTab === 'more' && (
              <MorePanel
                theme={theme}
                onToggleTheme={toggleTheme}
                currentLang={currentLang}
                onLanguageChange={setCurrentLang}
              />
            )}
          </div>
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} currentLang={currentLang} />
      </div>

      {/* Modals */}
      <NotificationSimulator
        notification={activeNotification}
        onClose={() => setActiveNotification(null)}
        onInspect={() => { setActiveTab('message'); setActiveNotification(null); }}
        onPlayVoice={() => { if (activeNotification) speakText(activeNotification.message, currentLang); }}
      />

      <MicroFrictionModal
        isOpen={!!microFrictionUpi}
        onClose={() => setMicroFrictionUpi(null)}
        upiDetails={microFrictionUpi}
        currentLang={currentLang}
        onPlayVoice={() => speakText(
          'रुकिए! आप पैसे भेज रहे हैं। यूपीआई पिन केवल पैसे भेजने के लिए होता है, कैशबैक पाने के लिए नहीं।',
          currentLang
        )}
      />

      <SafeSandboxModal isOpen={!!sandboxThreat} onClose={() => setSandboxThreat(null)} threatData={sandboxThreat} />
      <IncidentReportModal isOpen={!!reportThreat} onClose={() => setReportThreat(null)} threatData={reportThreat} />
      <BlockchainLedger isOpen={isLedgerOpen} onClose={() => setIsLedgerOpen(false)} />

      <ScamExamplePanel
        scam={activeScamExample}
        onClose={() => setActiveScamExample(null)}
        onReport={(s) => { setReportThreat(s); setActiveScamExample(null); }}
      />
    </div>
  );
}

function getTabSubtitle(tab) {
  const subs = {
    message: 'Paste any SMS or WhatsApp message asking for money or a KYC update.',
    url: 'Enter any website or link to verify whether it is an official site or a fake clone.',
    qr: 'Check UPI payment requests and cashback QR codes before money is debited.',
    apk: 'Check if a downloaded app has dangerous permissions that could spy or steal OTPs.',
  };
  return subs[tab] || '';
}
