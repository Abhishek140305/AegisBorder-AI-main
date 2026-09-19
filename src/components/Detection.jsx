import {
  Fingerprint, FileCheck2, ShieldAlert, AlertTriangle, Gauge, BarChart3, AlertCircle,
  Info, CheckCircle2, XCircle, ArrowUpRight
} from 'lucide-react';
import { cx, accent } from './ui';
import { tierMeta } from '../lib/store';

export const DETECTIONS = {
  identity: { label: 'Identity', icon: Fingerprint, accent: 'identity' },
  document: { label: 'Document', icon: FileCheck2, accent: 'document' },
  fraud: { label: 'Fraud', icon: AlertTriangle, accent: 'fraud' },
  threat: { label: 'Threat', icon: ShieldAlert, accent: 'threat' },
  risk: { label: 'Risk', icon: Gauge, accent: 'risk' },
  analytics: { label: 'Analytics', icon: BarChart3, accent: 'analytics' },
};

export function detectionFor(riskTier, watchlistFlagged, operationType) {
  if (watchlistFlagged || operationType) return 'threat';
  if (riskTier === 'CRITICAL') return 'threat';
  if (riskTier === 'HIGH' || riskTier === 'MODERATE') return 'risk';
  return 'document';
}

export function DetectionBadge({ type = 'risk', titleCase = true }) {
  const d = DETECTIONS[type] || DETECTIONS.risk;
  const ac = accent(d.accent);
  const Icon = d.icon;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold', ac.soft, ac.text, ac.border)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {d.label}
    </span>
  );
}

const SEVERITY = {
  Info: { label: 'Info', icon: Info, text: 'text-sky-700', soft: 'bg-sky-50', border: 'border-sky-200' },
  Low: { label: 'Low', icon: CheckCircle2, text: 'text-teal-700', soft: 'bg-teal-50', border: 'border-teal-200' },
  Moderate: { label: 'Moderate', icon: AlertCircle, text: 'text-amber-700', soft: 'bg-amber-50', border: 'border-amber-200' },
  Medium: { label: 'Medium', icon: AlertCircle, text: 'text-amber-700', soft: 'bg-amber-50', border: 'border-amber-200' },
  High: { label: 'High', icon: AlertTriangle, text: 'text-orange-700', soft: 'bg-orange-50', border: 'border-orange-200' },
  Critical: { label: 'Critical', icon: XCircle, text: 'text-red-700', soft: 'bg-red-50', border: 'border-red-200' },
};

export function SeverityBadge({ severity = 'Low' }) {
  const s = SEVERITY[severity] || SEVERITY.Medium;
  const Icon = s.icon;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold', s.soft, s.text, s.border)}>
      <Icon className="h-3 w-3" aria-hidden="true" /> {s.label}
    </span>
  );
}

const TIER_STYLE = {
  LOW: { text: 'text-emerald-700', soft: 'bg-emerald-50', ring: 'ring-emerald-600' },
  MODERATE: { text: 'text-amber-700', soft: 'bg-amber-50', ring: 'ring-amber-600' },
  HIGH: { text: 'text-orange-700', soft: 'bg-orange-50', ring: 'ring-orange-600' },
  CRITICAL: { text: 'text-red-700', soft: 'bg-red-50', ring: 'ring-red-600' },
};

export function RiskBadge({ tier = 'LOW' }) {
  const meta = tierMeta(tier);
  const st = TIER_STYLE[tier] || TIER_STYLE.LOW;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-extrabold', st.soft, st.text)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', TIER_DOT[tier] || 'bg-emerald-500')} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

const TIER_DOT = {
  LOW: 'bg-emerald-500',
  MODERATE: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-600',
};

export function AlertCard({ alert, onReview, onOpenCase }) {
  const type = detectionFor(alert.riskTier, alert.watchlistFlagged, alert.operationType);
  const ac = accent(DETECTIONS[type].accent);
  const Icon = DETECTIONS[type].icon;
  const resolved = !!alert.resolution;
  return (
    <article className={cx('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', resolved && 'opacity-70')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DetectionBadge type={type} />
        <SeverityBadge severity={alert.severity} />
      </div>
      <h4 className="mt-3 text-sm font-extrabold text-navy-900">{alert.title}</h4>
      {alert.person && (
        <p className="mt-1 text-xs text-slate-500">{alert.person}{alert.documentNumber ? ` · ${alert.documentNumber}` : ''}</p>
      )}
      {alert.factors?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {alert.factors.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <Icon className={cx('mt-0.5 h-3 w-3 shrink-0', ac.text)} aria-hidden="true" />
              <span className="leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        {onReview && (
          <button onClick={() => onReview(alert)} className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-navy-400 hover:text-navy-900">
            {resolved ? 'Mark unread' : 'Mark handled'}
          </button>
        )}
        {onOpenCase && (
          <button onClick={() => onOpenCase(alert)} className="flex items-center gap-1 rounded-md bg-navy-800 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-navy-900">
            Open case <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-400">{new Date(alert.ts).toLocaleString()}</span>
      </div>
    </article>
  );
}

export function DetectionExplanation({ type = 'risk', title, rows = [], note, actionLabel, onAction }) {
  const d = DETECTIONS[type] || DETECTIONS.risk;
  const ac = accent(d.accent);
  const Icon = d.icon;
  return (
    <div className={cx('overflow-hidden rounded-lg border bg-white shadow-sm', ac.border)}>
      <div className={cx('flex items-center gap-2.5 border-b px-4 py-3', ac.soft)}>
        <span className={cx('flex h-8 w-8 items-center justify-center rounded-md', ac.text)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{d.label} analysis</p>
          <h4 className="text-sm font-extrabold text-navy-900">{title}</h4>
        </div>
      </div>
      <dl className="divide-y divide-slate-100">
        {rows.map(({ k, v, strong }) => (
          <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <dt className="text-xs font-semibold text-slate-500">{k}</dt>
            <dd className={cx('text-right text-xs', strong ? 'font-extrabold text-navy-900' : 'font-semibold text-slate-700')}>{v}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="border-t border-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-500">{note}</p>}
      {actionLabel && onAction && (
        <div className="border-t border-slate-100 px-4 py-3">
          <button onClick={onAction} className="flex items-center gap-1.5 rounded-md bg-navy-800 px-3 py-2 text-xs font-bold text-white hover:bg-navy-900">
            {actionLabel} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-xs font-bold text-navy-800">
      {label}
      <button onClick={onRemove} aria-label={`Remove filter ${label}`} className="flex h-4 w-4 items-center justify-center rounded-full text-navy-500 hover:bg-navy-200">
        ×
      </button>
    </span>
  );
}

export function FilterBar({ chips, onRemove, onClear, count }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
      {chips.map(({ key, label }) => (
        <FilterChip key={key} label={label} onRemove={() => onRemove(key)} />
      ))}
      <button onClick={onClear} className="ml-auto text-xs font-bold text-slate-500 underline-offset-2 hover:text-red-600 hover:underline">
        Clear filters ({count})
      </button>
    </div>
  );
}