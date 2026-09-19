import React from 'react';
import { Search, Database, Globe, Sun, Moon, Settings, ChevronRight } from 'lucide-react';
import { SUPPORTED_LANGUAGES, TOPBAR_LABELS, t } from '../engine/regionalDictionary';

const REGISTRY_LABELS = { en: 'Registry', hi: 'रजिस्ट्री', ta: 'பதிவு', te: 'రెజిస్ట్రీ', bn: 'রেজিস্ট্রি', mr: 'रजिस्ट्री' };
const SEARCH_PLACEHOLDERS = {
  en: 'Search scams, numbers, websites…',
  hi: 'धोखाधड़ी, नंबर, वेबसाइट खोजें…',
  ta: 'கற்றகங்கள், எண்கள், இணையதளங்கள் தேடு…',
  te: 'స్కామ్లు, నంబర్లు, వెబ్సైట్లు శోధించండి…',
  bn: 'স্ক্যাম, নম্বর, ওয়েবসাইট খুঁজুন…',
  mr: 'शक्य, नंबर, वेबसाइट शोधा…',
};

export default function TopBar({
  activeTab,
  currentLang,
  onLanguageChange,
  theme,
  onToggleTheme,
  onOpenLedger,
  onOpenSettings,
  searchQuery,
  onSearchChange,
}) {
  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center px-4 gap-3">
      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] min-w-0">
        <span className="font-medium text-[var(--text-secondary)]">Rakshak AI</span>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold text-[var(--text-primary)] truncate">{t(currentLang, TOPBAR_LABELS[activeTab])}</span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 h-9 w-56 lg:w-64">
        <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t(currentLang, SEARCH_PLACEHOLDERS)}
          className="bg-transparent border-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none w-full"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {/* Open Registry */}
        <button
          onClick={onOpenLedger}
          className="btn btn-ghost btn-sm h-8 px-3"
          title="Open Scam Registry"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[12.5px]">{t(currentLang, REGISTRY_LABELS)}</span>
        </button>

        {/* Language */}
        <div className="relative">
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[12.5px] font-medium text-[var(--text-secondary)]">
            <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent border-none text-[12.5px] font-medium text-[var(--text-secondary)] focus:outline-none cursor-pointer pr-1 appearance-none"
              aria-label="Language"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
