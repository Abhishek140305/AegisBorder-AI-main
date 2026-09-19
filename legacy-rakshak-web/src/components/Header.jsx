import React from 'react';
import { Globe, Wifi, WifiOff, Sun, Moon, ShieldCheck } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../engine/regionalDictionary';

export default function Header({
  currentLang,
  onLanguageChange,
  isOfflineMode,
  onToggleOffline,
  onOpenLedger,
  theme = 'light',
  onToggleTheme
}) {
  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 lg:px-6 flex items-center justify-between gap-3">
      {/* Left — protection status */}
      <div className="hidden md:flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-md bg-[var(--primary-subtle)] flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)] truncate">
          {currentLang === 'hi'
            ? 'रक्षक AI • डिजिटल सुरक्षा सहायक'
            : 'Rakshak AI • Digital Safety Companion'}
        </p>
      </div>

      {/* Mobile brand */}
      <div className="md:hidden flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-md bg-[var(--primary)] flex items-center justify-center text-white">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">Rakshak AI</p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Online / Offline */}
        <button
          onClick={onToggleOffline}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium border transition-colors ${
            isOfflineMode
              ? 'bg-[var(--warning-bg)] border-[var(--warning-border)] text-[var(--warning-text)]'
              : 'bg-[var(--safe-bg)] border-[var(--safe-border)] text-[var(--safe-text)]'
          }`}
          title="Online / offline protection"
        >
          {isOfflineMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live</span>
            </>
          )}
        </button>

        {/* Language */}
        <div className="relative flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)]">
          <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <select
            value={currentLang}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-transparent border-none text-xs font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer pr-1 appearance-none"
            aria-label="Language"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
