import React from 'react';
import { Home, MessageSquare, Globe, Database, MoreHorizontal } from 'lucide-react';
import { BOTTOM_NAV_LABELS, t } from '../engine/regionalDictionary';

const ICONS = { home: Home, message: MessageSquare, url: Globe, registry: Database, more: MoreHorizontal };

export default function BottomNav({ activeTab, onTabChange, currentLang = 'hi' }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] h-16 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Primary navigation"
    >
      {['home', 'message', 'url', 'registry', 'more'].map((id) => {
        const active = activeTab === id;
        const label = t(currentLang, BOTTOM_NAV_LABELS[id]);
        const Icon = ICONS[id];
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              className={`w-5 h-5 transition-colors ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
              strokeWidth={active ? 2 : 1.75}
            />
            <span className={`text-[10.5px] font-medium transition-colors ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
