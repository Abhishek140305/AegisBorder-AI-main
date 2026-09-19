import React from 'react';
import { Settings, Globe, Moon, Sun, Lock, Phone, BookOpen, FileText, User } from 'lucide-react';
import { SUPPORTED_LANGUAGES, MORE, HOME, t } from '../engine/regionalDictionary';

export default function MorePanel({ theme, onToggleTheme, currentLang, onLanguageChange }) {
  return (
    <div className="space-y-4">
      {/* Language + theme */}
      <section className="panel-elevated p-5">
        <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">
          {t(currentLang, MORE.preferences)}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <Globe className="w-3 h-3" />
              {t(currentLang, MORE.language)}
            </label>
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="input"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              {theme === 'light' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              {t(currentLang, MORE.appearance)}
            </label>
            <button onClick={onToggleTheme} className="btn btn-secondary w-full justify-between">
              <span>{t(currentLang, theme === 'light' ? MORE.switchToDark : MORE.switchToLight)}</span>
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="panel-elevated p-5">
        <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[var(--primary)]" />
          {t(currentLang, MORE.privacy)}
        </h2>
        <ul className="space-y-1.5 text-[12.5px] text-[var(--text-secondary)]">
          {HOME.privacy.list.map((item, i) => (
            <li key={i}>✓ {t(currentLang, item)}</li>
          ))}
        </ul>
      </section>

      {/* Help / Report */}
      <section className="panel-elevated p-5">
        <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">
          {t(currentLang, MORE.helpSupport)}
        </h2>
        <div className="space-y-1.5">
          <a className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-[var(--bg-hover)] cursor-pointer" href="#">
            <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-[13px] text-[var(--text-primary)]">{t(currentLang, MORE.safetyGuide)}</span>
          </a>
          <a className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-[var(--bg-hover)] cursor-pointer" href="#">
            <FileText className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-[13px] text-[var(--text-primary)]">{t(currentLang, MORE.reportScam)}</span>
          </a>
          <a className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-[var(--bg-hover)] cursor-pointer" href="#">
            <User className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-[13px] text-[var(--text-primary)]">{t(currentLang, MORE.accountDevices)}</span>
          </a>
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2 px-3 py-2.5 rounded-md bg-[var(--bg-elevated)]">
          <Phone className="w-4 h-4 text-[var(--primary)]" />
          <div>
            <p className="text-[12.5px] text-[var(--text-muted)]">{t(currentLang, MORE.cyberHelpline)}</p>
            <p className="text-[14px] font-semibold text-[var(--text-primary)] tabular-nums">1930</p>
          </div>
        </div>
      </section>

      <p className="text-[11px] text-[var(--text-muted)] px-1 text-center">{t(currentLang, MORE.rakshakV1)}</p>
    </div>
  );
}
