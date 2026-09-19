import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cx } from './ui';

const listeners = new Set();
let toasts = [];

export function toast(message, opts = {}) {
  toasts = [...toasts, { id: Date.now() + Math.random(), message, title: opts.title, type: opts.type || 'info' }];
  if (toasts.length > 4) toasts = toasts.slice(-4);
  listeners.forEach((l) => l(toasts));
  return toasts[toasts.length - 1].id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  listeners.forEach((l) => l(toasts));
}

const STYLES = {
  success: { icon: CheckCircle2, border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-800', chip: 'bg-emerald-600' },
  warning: { icon: AlertTriangle, border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-800', chip: 'bg-amber-500' },
  error: { icon: XCircle, border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-800', chip: 'bg-red-600' },
  info: { icon: Info, border: 'border-blue-200', bg: 'bg-navy-50', text: 'text-navy-700', chip: 'bg-blue-600' },
};

export function ToastHost() {
  const [items, setItems] = useState(toasts);

  useEffect(() => {
    listeners.add(setItems);
    return () => listeners.delete(setItems);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const timers = items.map((t) => setTimeout(() => dismissToast(t.id), 4500));
    return () => timers.forEach(clearTimeout);
  }, [items]);

  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[70] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" role="status" aria-live="polite">
      {items.map((t) => {
        const s = STYLES[t.type] || STYLES.info;
        const Icon = s.icon;
        return (
          <div key={t.id} className={cx('pointer-events-auto flex items-start gap-3 rounded-xl border shadow-lg backdrop-blur', s.border, s.bg)}>
            <span className={cx('mt-3 ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white', s.chip)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 py-2.5 pr-2">
              {t.title && <div className={cx('text-xs font-bold uppercase tracking-wide', s.text)}>{t.title}</div>}
              <div className="text-sm font-medium text-slate-800">{t.message}</div>
            </div>
            <button className="p-2.5 text-slate-400 hover:text-slate-700" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}