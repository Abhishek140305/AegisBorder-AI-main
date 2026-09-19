import { createElement, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, Info, AlertTriangle, XCircle, X, Loader2, ArrowUp, ArrowDown, ShieldAlert as ShieldAlertIcon, MapPin } from 'lucide-react';

export function cx(...parts) {
  return twMerge(clsx(parts));
}

/* ------------------------------------------------------------
   Feature accent system — controlled multi-palette foundation.
   Every feature family shares the same institutional base but
   carries its own accent for section headers, icons, bars, etc.
   ------------------------------------------------------------ */
export const ACCENT = {
  identity: {   // indigo — identity verification
    soft: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-700',
    bar: 'bg-indigo-600', border: 'border-indigo-200', ring: 'ring-indigo-600',
    dot: 'bg-indigo-600', tile: 'bg-indigo-50 text-indigo-700',
  },
  document: {   // teal — document screening
    soft: 'bg-teal-50', text: 'text-teal-700', icon: 'text-teal-700',
    bar: 'bg-teal-600', border: 'border-teal-200', ring: 'ring-teal-600',
    dot: 'bg-teal-600', tile: 'bg-teal-50 text-teal-700',
  },
  threat: {     // crimson — threat detection
    soft: 'bg-red-50', text: 'text-red-800', icon: 'text-red-700',
    bar: 'bg-red-700', border: 'border-red-200', ring: 'ring-red-700',
    dot: 'bg-red-700', tile: 'bg-red-50 text-red-700',
  },
  fraud: {      // orange — fraud detection
    soft: 'bg-orange-50', text: 'text-orange-800', icon: 'text-orange-700',
    bar: 'bg-orange-600', border: 'border-orange-200', ring: 'ring-orange-600',
    dot: 'bg-orange-600', tile: 'bg-orange-50 text-orange-700',
  },
  risk: {       // purple — risk assessment
    soft: 'bg-violet-50', text: 'text-violet-800', icon: 'text-violet-700',
    bar: 'bg-violet-600', border: 'border-violet-200', ring: 'ring-violet-600',
    dot: 'bg-violet-600', tile: 'bg-violet-50 text-violet-700',
  },
  analytics: {  // blue/cyan — analytics & reports
    soft: 'bg-sky-50', text: 'text-sky-800', icon: 'text-sky-700',
    bar: 'bg-sky-600', border: 'border-sky-200', ring: 'ring-sky-600',
    dot: 'bg-sky-600', tile: 'bg-sky-50 text-sky-700',
  },
  system: {     // slate — system & administration
    soft: 'bg-slate-100', text: 'text-slate-800', icon: 'text-slate-700',
    bar: 'bg-navy-700', border: 'border-slate-300', ring: 'ring-slate-600',
    dot: 'bg-slate-600', tile: 'bg-slate-100 text-slate-700',
  },
};

export function accent(name) {
  return ACCENT[name] || ACCENT.system;
}

/* ------------------------------------------------------------
   Unified status language: always ICON + COLOUR + TEXT
   ------------------------------------------------------------ */
export const STATUS = {
  verified: { label: 'Verified', color: 'green', icon: CheckCircle2 },
  approved: { label: 'Approved', color: 'green', icon: CheckCircle2 },
  clear: { label: 'Clear', color: 'green', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'green', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'blue', icon: Info },
  reviewing: { label: 'In Review', color: 'blue', icon: Info },
  queued: { label: 'Queued', color: 'blue', icon: Info },
  review_required: { label: 'Review Required', color: 'amber', icon: AlertTriangle },
  potential_risk: { label: 'Potential Risk', color: 'orange', icon: AlertTriangle },
  attention: { label: 'Needs Attention', color: 'orange', icon: AlertTriangle },
  high_risk: { label: 'High Risk', color: 'red', icon: ShieldAlertIcon },
  threat_detected: { label: 'Threat Detected', color: 'red', icon: ShieldAlertIcon },
  fraud_suspected: { label: 'Fraud Suspected', color: 'red', icon: ShieldAlertIcon },
  critical: { label: 'Critical', color: 'rose', icon: ShieldAlertIcon },
};

const PALETTE = {
  green:  { bg: 'bg-emerald-50',  text: 'text-emerald-800',  border: 'border-emerald-200',  dot: 'bg-emerald-600', bar: 'bg-emerald-600' },
  amber:  { bg: 'bg-amber-50',    text: 'text-amber-900',    border: 'border-amber-200',    dot: 'bg-amber-500',  bar: 'bg-amber-500' },
  orange: { bg: 'bg-orange-50',   text: 'text-orange-900',   border: 'border-orange-200',   dot: 'bg-orange-500', bar: 'bg-orange-500' },
  red:    { bg: 'bg-red-50',      text: 'text-red-900',      border: 'border-red-200',      dot: 'bg-red-600',    bar: 'bg-red-600' },
  rose:   { bg: 'bg-rose-50',     text: 'text-rose-900',     border: 'border-rose-200',     dot: 'bg-rose-600',   bar: 'bg-rose-600' },
  blue:   { bg: 'bg-blue-50',     text: 'text-blue-900',     border: 'border-blue-200',     dot: 'bg-blue-600',   bar: 'bg-blue-600' },
  lime:   { bg: 'bg-lime-50',     text: 'text-lime-800',     border: 'border-lime-200',     dot: 'bg-lime-600',   bar: 'bg-lime-600' },
  yellow: { bg: 'bg-yellow-50',   text: 'text-yellow-800',   border: 'border-yellow-200',   dot: 'bg-yellow-500', bar: 'bg-yellow-500' },
  slate:  { bg: 'bg-slate-50',    text: 'text-slate-700',    border: 'border-slate-200',    dot: 'bg-slate-500',  bar: 'bg-slate-500' },
};

export const SEVERITY_STEPS = [
  { step: 1, name: 'No risk', color: 'green' },
  { step: 2, name: 'Minimal', color: 'lime' },
  { step: 3, name: 'Low', color: 'yellow' },
  { step: 4, name: 'Moderate', color: 'amber' },
  { step: 5, name: 'High', color: 'orange' },
  { step: 6, name: 'Severe', color: 'red' },
  { step: 7, name: 'Critical', color: 'rose' },
];

export function tierSeverityColor(tier) {
  const map = { LOW: 'green', MODERATE: 'amber', HIGH: 'orange', CRITICAL: 'rose' };
  return map[tier] || 'slate';
}

export function Badge({ color = 'slate', children, className, icon }) {
  const c = PALETTE[color] || PALETTE.slate;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold', c.bg, c.text, c.border, className)}>
      {icon}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const s = STATUS[status] || { label: status || '—', color: 'slate', icon: Info };
  const c = PALETTE[s.color] || PALETTE.slate;
  const Icon = s.icon;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold', c.bg, c.text, c.border, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function StatusDot({ color = 'slate', className }) {
  const c = PALETTE[color] || PALETTE.slate;
  return <span className={cx('inline-block h-2 w-2 rounded-full', c.dot, className)} aria-hidden="true" />;
}

export function Card({ className, children, tone }) {
  return (
    <div className={cx('rounded-lg border border-slate-200 bg-white', className)}>
      {children}
    </div>
  );
}

export function SectionHeader({ accent: a = 'system', icon: Icon, title, eyebrow, actions, id }) {
  const ac = accent(a);
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-md border', ac.tile, ac.border)} aria-hidden="true">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          {eyebrow && <p className={cx('text-[10px] font-bold uppercase tracking-wider', ac.text)}>{eyebrow}</p>}
          <h2 id={id} className="text-[15px] font-bold leading-tight tracking-tight text-navy-900">{title}</h2>
        </div>
      </div>
      {actions}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  success: 'btn-success',
};

export function Button({ variant = 'primary', className, loading, disabled, children, ...rest }) {
  return (
    <button
      className={cx(
        BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className, ...rest }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx('inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const panel = panelRef.current;
    const focusables = () => {
      if (!panel) return [];
      return [...panel.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !el.disabled && el.offsetParent !== null);
    };
    const first = focusables()[0];
    (first || panel || prev)?.focus?.();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key === 'Tab') {
        const f = focusables();
        if (f.length === 0) return;
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (prev && typeof prev.focus === 'function' && prev !== document.body) prev.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-navy-950/60" aria-hidden="true" onClick={onClose} />
      <div ref={panelRef} className={cx('relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl', wide ? 'max-w-4xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between border-b border-slate-200 bg-navy-900 px-5 py-3.5 text-white">
          <h2 className="text-base font-bold tracking-tight">{title}</h2>
          <IconButton label="Close" onClick={onClose} className="text-slate-300 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function verifyIcon(kind) {
  if (kind === 'pass') return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
  if (kind === 'warn') return <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />;
  if (kind === 'fail') return <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />;
  return <Info className="h-5 w-5 text-blue-600" aria-hidden="true" />;
}

export function ProgressSteps({ steps, current }) {
  return (
    <ol className="flex w-full items-center" aria-label="Workflow progress">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex flex-1 items-center">
            {i > 0 && <span className={cx('mx-2 h-0.5 flex-1 rounded', done || active ? 'bg-navy-700' : 'bg-slate-200')} aria-hidden="true" />}
            <div className={cx('flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold',
              active ? 'bg-navy-800 text-white shadow-sm' : done ? 'text-navy-800' : 'text-slate-400')}>
              <span className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                active ? 'bg-white/20 text-white' : done ? 'bg-navy-100 text-navy-800' : 'bg-slate-100 text-slate-400')}>
                {done ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function EmptyState({ icon, title, hint, className, small, actionLabel, onAction }) {
  const iconNode = (typeof icon === 'function' || (typeof icon === 'object' && icon != null && typeof icon.render === 'function'))
    ? createElement(icon)
    : icon;
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center', small ? 'py-8' : 'py-12', className)}>
      <div className={cx('flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400', small ? 'h-10 w-10' : 'h-12 w-12')}>
        {iconNode}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-navy-400 hover:text-navy-900">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, accent: a = 'system', icon: Icon, actions }) {
  const ac = accent(a);
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
      <div>
        {eyebrow && (
          <p className={cx('mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest', ac.text)}>
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}{eyebrow}
          </p>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({ icon: Icon, label, value, delta, tone, hint }) {
  const c = PALETTE[tone] || (tone && ACCENT[tone]) || PALETTE.slate;
  return (
    <div className="panel flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50" aria-hidden="true">
          {Icon && <Icon className={cx('h-[18px] w-[18px]', c.text)} />}
        </span>
        {delta != null && (
          <span
            className={cx('inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              delta >= 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700')}
            title={delta >= 0 ? 'Up vs. earlier period' : 'Down vs. earlier period'}
          >
            {delta >= 0 ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />}
            {Math.abs(delta)}
          </span>
        )}
      </div>
      <div>
        <div className="text-[26px] font-extrabold leading-none tracking-tight text-navy-900 tabular-nums">{value}</div>
        <div className="mt-1.5 text-xs font-semibold text-slate-500">{label}</div>
      </div>
      {hint && <p className="text-[11px] leading-snug text-slate-400">{hint}</p>}
    </div>
  );
}

export function DonutChart({ segments, size = 148, thickness = 14, label, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f4" strokeWidth={thickness} />
        {total > 0 && segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-all duration-500" />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-extrabold leading-none text-navy-900 tabular-nums">{centerValue ?? total}</span>
        {centerLabel && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{centerLabel}</span>}
      </div>
    </div>
  );
}

export function MiniBarChart({ values, height = 140, color = 'bg-navy-700', labels }) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }} aria-hidden="true">
        {values.map((v, i) => (
          <div key={i} className="group relative flex-1">
            <div className={cx('mx-0.5 w-full rounded-t-sm transition-colors hover:opacity-80', color)}
              style={{ height: `${Math.max(2, (v / max) * 100)}%` }} title={String(v)} />
          </div>
        ))}
      </div>
      {labels && (
        <div className="mt-2 flex justify-between text-[10px] text-slate-400">{labels}</div>
      )}
    </div>
  );
}

export function Pagination({ page, pages, total, onChange, label, prevLabel = 'Prev', nextLabel = 'Next' }) {
  if (pages <= 1) return null;
  const go = (p) => onChange(Math.max(0, Math.min(pages - 1, p)));
  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3" aria-label={label || 'Pagination'}>
      <p className="text-[11px] text-slate-400">{total} result(s)</p>
      <div className="flex items-center gap-1">
        <Button variant="secondary" className="!px-2.5 !py-1 text-xs" disabled={page === 0} onClick={() => go(page - 1)}>{prevLabel}</Button>
        <span className="px-2 text-xs font-semibold text-slate-600 tabular-nums">{page + 1} / {pages}</span>
        <Button variant="secondary" className="!px-2.5 !py-1 text-xs" disabled={page === pages - 1} onClick={() => go(page + 1)}>{nextLabel}</Button>
      </div>
    </nav>
  );
}

export function downloadCSV(filename, head, rows, options = {}) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const bom = '\uFEFF';
  const body = [head, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([bom + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = options.filename || filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function SeverityScale({ currentTier, labels }) {
  const current = (() => {
    const map = { LOW: 1, MODERATE: 4, HIGH: 5, CRITICAL: 7 };
    return map[currentTier] || 0;
  })();
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{labels?.title || 'Risk severity scale'}</span>
        <span className="rounded bg-navy-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Operating scale
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {SEVERITY_STEPS.map((s) => {
          const c = PALETTE[s.color];
          const active = current === s.step;
          return (
            <div key={s.step} title={s.name}
              className={cx('flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-center',
                active ? cx('border-navy-800 ring-2 ring-navy-800/15', c.bg) : 'border-slate-200')}>
              <span className={cx('text-[10px] font-bold', c.text)}>{s.step}</span>
              <span className="w-full text-[9px] font-semibold leading-tight text-slate-500">{s.name}</span>
              <span className={cx('h-1.5 w-full rounded-full', c.dot)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Phase 1 additions — structured screening primitives.
   Operational, light, explainable. Only surface fields the
   backend actually produces; never invent confidence/percentages.
   ------------------------------------------------------------ */

const RISK_TIER_META = {
  LOW:      { label: 'Verified',   color: 'green',  ring: 'ring-emerald-500' },
  MODERATE: { label: 'Review Required', color: 'amber', ring: 'ring-amber-500' },
  HIGH:     { label: 'High Risk',  color: 'orange', ring: 'ring-orange-500' },
  CRITICAL: { label: 'Critical',   color: 'rose',   ring: 'ring-rose-600' },
};

export function RiskBadge({ tier, score, className }) {
  const m = RISK_TIER_META[tier] || RISK_TIER_META.LOW;
  const c = PALETTE[m.color] || PALETTE.slate;
  return (
    <span className={cx('inline-flex items-center gap-2 rounded-lg border px-3 py-1.5', c.bg, c.text, c.border, className)}>
      <ShieldAlertIcon className="h-4 w-4" aria-hidden="true" />
      <span className="text-sm font-extrabold">{tier}</span>
      {score != null && <span className="text-sm font-semibold tabular-nums">{Number(score).toFixed(0)}%</span>}
    </span>
  );
}

const CHECK_STATE_META = {
  pass:  { label: 'Passed',       color: 'green' },
  warn:  { label: 'Review',       color: 'amber' },
  fail:  { label: 'Failed',       color: 'red' },
  none:  { label: 'Not checked',  color: 'slate' },
  incon: { label: 'Inconclusive', color: 'blue' },
};

export function StatusGrid({ items, className }) {
  return (
    <ul className={cx('grid gap-2 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((it, i) => {
        const s = CHECK_STATE_META[it.state] || CHECK_STATE_META.none;
        const c = PALETTE[s.color] || PALETTE.slate;
        return (
          <li key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <span className={cx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', c.dot)} aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{it.label}</span>
                <span className={cx('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', c.bg, c.text)}>{s.label}</span>
              </div>
              {it.desc && <p className="mt-0.5 text-xs leading-snug text-slate-500">{it.desc}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function FindingCard({ title, where, why, severity, confidence, evidence, className }) {
  const sevColor = { LOW: 'green', MODERATE: 'amber', HIGH: 'orange', CRITICAL: 'rose' }[severity] || 'slate';
  return (
    <article className={cx('rounded-lg border border-slate-200 bg-white p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        {severity && <Badge color={sevColor}>{severity}</Badge>}
      </div>
      <dl className="mt-2 space-y-1 text-xs">
        {where != null && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-slate-400">Where</dt>
            <dd className="text-slate-700">{where}</dd>
          </div>
        )}
        {why && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-slate-400">Why</dt>
            <dd className="text-slate-700">{why}</dd>
          </div>
        )}
        {confidence != null && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-slate-400">Confidence</dt>
            <dd className="font-mono text-slate-700">{confidence}</dd>
          </div>
        )}
        {evidence != null && evidence.length > 0 && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-slate-400">Evidence</dt>
            <dd className="flex flex-wrap gap-1">
              {evidence.map((e, i) => <span key={i} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{e}</span>)}
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}

export function DecisionPanel({ tier, score, decision, summary, factors, className }) {
  return (
    <Card className={cx('overflow-hidden', tier === 'CRITICAL' && 'ring-2 ring-rose-300', className)}>
      <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge tier={tier} score={score} />
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-bold text-slate-700">{decision}</span>
          </div>
          {summary && <p className="mt-2 text-sm text-slate-600">{summary}</p>}
        </div>
        <div className="text-left md:text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Composite risk</div>
          <div className="text-3xl font-black tabular-nums text-navy-900">{score}<span className="text-lg text-slate-400">%</span></div>
        </div>
      </div>
      {factors && factors.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Reasons for this decision</p>
          <ul className="space-y-1.5">
            {factors.map((f, i) => {
              return (
                <li key={i} className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className="text-slate-700"><strong className="font-bold text-slate-900">{f.module}:</strong> {f.description}</span>
                  {f.impact && <span className="shrink-0 text-xs font-bold text-slate-500">{f.impact}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}

export function StepRail({ steps, current, className }) {
  return (
    <ol className={cx('flex w-full items-center', className)} aria-label="Screening progress">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const state = active ? 'Current' : done ? 'Complete' : 'Pending';
        return (
          <li key={s.key || s.label} className="flex flex-1 items-center">
            {i > 0 && <span className={cx('mx-1.5 h-0.5 flex-1 sm:mx-2', done || active ? 'bg-navy-700' : 'bg-slate-200')} aria-hidden="true" />}
            <div
              className={cx('flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-semibold sm:px-2.5 sm:py-1.5 sm:text-xs',
                active ? 'bg-navy-800 text-white shadow-sm' : done ? 'text-navy-800' : 'text-slate-400')}
              title={`${s.label} — ${state}`}
            >
              <span className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                active ? 'bg-white/20 text-white' : done ? 'bg-navy-100 text-navy-800' : 'bg-slate-100 text-slate-400')}>
                {done ? '✓' : i + 1}
              </span>
              <span className="hidden md:inline">{s.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DocInspector({ image, regions, className }) {
  const [selected, setSelected] = useState(regions && regions.length ? 0 : null);
  const imgRef = useRef(null);
  const [viewport, setViewport] = useState(null);

  useEffect(() => {
    function compute() {
      if (imgRef.current) {
        const r = imgRef.current.getBoundingClientRect();
        setViewport({ w: r.width, h: r.height, nw: imgRef.current.naturalWidth, nh: imgRef.current.naturalHeight });
      }
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [image]);

  useEffect(() => {
    if (!regions || regions.length === 0) { setSelected(null); return; }
    if (selected == null || selected >= regions.length) setSelected(0);
  }, [regions]);

  const toPct = (num) => {
    const n = Number(num);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  };

  return (
    <div className={cx('grid gap-4 lg:grid-cols-2', className)}>
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {image ? (
          <img ref={imgRef} src={image} alt="Document under inspection" className="max-h-[420px] w-full object-contain"
            onLoad={() => {
              const r = imgRef.current && imgRef.current.getBoundingClientRect();
              if (imgRef.current) setViewport({ w: r.width, h: r.height, nw: imgRef.current.naturalWidth, nh: imgRef.current.naturalHeight });
            }} />
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">No document image</div>
        )}
        {viewport && regions && regions.map((rg, i) => {
          const active = selected === i;
          const x = rg.x, y = rg.y, w = rg.width, h = rg.height;
          if (x == null || y == null || w == null || h == null) return null;
          const left = toPct(x) / 100 * viewport.w;
          const top = toPct(y) / 100 * viewport.h;
          const bw = toPct(w) / 100 * viewport.w;
          const bh = toPct(h) / 100 * viewport.h;
          return (
            <button key={i} type="button" onClick={() => setSelected(i)}
              className={cx('absolute rounded border-2 transition-all', active ? 'border-red-600 bg-red-500/10' : 'border-red-400/60 hover:bg-red-500/10')}
              style={{ left, top, width: bw, height: bh }}
              aria-label={`Region ${i + 1}: ${rg.type || 'anomaly'}`}
            />
          );
        })}
      </div>
      <div className="space-y-2">
        {(!regions || regions.length === 0) && (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">No suspicious regions were reported by the engine.</p>
        )}
        {regions && regions.map((rg, i) => (
          <button key={i} type="button" onClick={() => setSelected(i)}
            className={cx('w-full rounded-lg border p-3 text-left transition-colors',
              selected === i ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50')}>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-600" aria-hidden="true" />
              <span className="text-sm font-bold text-slate-900">{rg.type || 'Suspicious region'}</span>
              <span className="ml-auto text-[10px] font-semibold text-slate-400">{i + 1}/{regions.length}</span>
            </div>
            {rg.local_intensity != null && (
              <p className="mt-1 text-xs text-slate-500">Local intensity: <span className="font-mono">{Number(rg.local_intensity).toFixed(0)}</span></p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}