import React from 'react';
import {
  Shield,
  Home,
  MessageSquare,
  Globe,
  QrCode,
  AppWindow,
  Database,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
} from 'lucide-react';
import { NAV_LABELS, NAV_SUBS, HOME, MORE, t } from '../engine/regionalDictionary';

const ICONS = { home: Home, message: MessageSquare, url: Globe, qr: QrCode, apk: AppWindow, registry: Database, more: Settings };
const NAV_IDS = ['home', 'message', 'url', 'qr', 'apk', 'registry', 'more'];

export default function Sidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose, currentLang = 'hi' }) {
  const handleNav = (id) => {
    onTabChange(id);
    if (isMobileOpen) onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 animate-fade-in lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]
          flex flex-col
          transition-[width] duration-150 ease-out
          ${isCollapsed ? 'w-[68px]' : 'w-[240px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative
        `}
      >
        {/* Header */}
        <div className={`h-14 px-3 flex items-center border-b border-[var(--border-subtle)] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-[13.5px] font-semibold text-[var(--text-primary)] leading-tight">Rakshak AI</h1>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">Scam & Fraud Shield</p>
              </div>
            )}
          </div>

          {/* Collapse toggle (desktop) */}
          {!isCollapsed ? (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex absolute -right-3 top-[22px] items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-sm"
              title="Expand sidebar"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {currentLang === 'hi' ? 'मेनू' : currentLang === 'ta' ? 'பட்டி' : currentLang === 'te' ? 'మెను' : currentLang === 'bn' ? 'মেনু' : currentLang === 'mr' ? 'मेनू' : 'Menu'}
            </div>
          )}
          {NAV_IDS.map((id) => {
            const active = activeTab === id;
            const label = t(currentLang, NAV_LABELS[id]);
            const sub = t(currentLang, NAV_SUBS[id]);
            const Icon = ICONS[id];
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                title={isCollapsed ? label : undefined}
                className={`nav-item ${isCollapsed ? 'justify-center px-0' : ''} ${active ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                {!isCollapsed && (
                  <div className="min-w-0">
                    <div className="text-[13px] leading-tight truncate">{label}</div>
                    <div className="text-[10.5px] text-[var(--text-muted)] leading-tight truncate">{sub}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: protection status */}
        <div className={`border-t border-[var(--border-subtle)] px-3 py-3 ${isCollapsed ? 'px-2' : ''}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--bg-elevated)]">
                <span className="status-dot status-dot-success" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight">
                    {t(currentLang, HOME.panels.protected)}
                  </p>
                  <p className="text-[10.5px] text-[var(--text-muted)] leading-tight">
                    {t(currentLang, HOME.panels.yourDeviceIs)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10.5px] text-[var(--text-muted)] text-center leading-tight">
                {t(currentLang, MORE.rakshakV1)}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="status-dot status-dot-success" />
              <p className="text-[10px] text-[var(--text-muted)] text-center">
                {t(currentLang, HOME.panels.protected)}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      title="Open menu"
    >
      <Menu className="w-4 h-4" />
    </button>
  );
}
