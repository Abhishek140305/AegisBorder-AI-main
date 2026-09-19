import { useState } from 'react';
import { Badge, Button, Card, cx } from '../ui';
import { FileText, RefreshCw, Check, ShieldCheck, ShieldAlert, AlertTriangle, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { setVoiceMuted, isVoiceMuted } from '../../lib/voiceAlert';

export function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

export function OperationShell({ icon, title, subtitle, inputs, onBack, children }) {
  const [muted, setMuted] = useState(isVoiceMuted());
  return (
    <div className="workspace">
      <div className="flex w-full flex-col gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-navy-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All operations
        </button>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-navy-100 bg-navy-50 text-navy-800">{icon}</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold tracking-tight text-slate-900">{title}</h2>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => { const next = !muted; setMuted(next); setVoiceMuted(next); }}
              title={muted ? 'Voice alerts muted — click to enable' : (window.speechSynthesis ? 'Voice alerts on for HIGH / CRITICAL results' : 'Voice alerts unavailable in this browser')}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-navy-300 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" aria-hidden="true" /> : <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />}
              {muted ? 'Voice alert off' : 'Voice alert on'}
            </button>
            {inputs && <Badge color="slate" className="hidden sm:inline-flex">{inputs}</Badge>}
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

const TONE = {
  LOW: { badge: 'green', bar: 'bg-emerald-500', icon: ShieldCheck, iconCls: 'text-emerald-600' },
  MODERATE: { badge: 'amber', bar: 'bg-amber-500', icon: AlertTriangle, iconCls: 'text-amber-600' },
  HIGH: { badge: 'orange', bar: 'bg-orange-500', icon: AlertTriangle, iconCls: 'text-orange-600' },
  CRITICAL: { badge: 'red', bar: 'bg-red-600', icon: ShieldAlert, iconCls: 'text-red-600' },
};

export function OperationResultCard({ display, onRunNew, onViewReport, savedId }) {
  if (!display) return null;
  const tone = TONE[display.tier] || TONE.LOW;
  const Icon = tone.icon;
  return (
    <Card className="overflow-hidden">
      <div className={cx('h-1', tone.bar)} />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-50', tone.iconCls)}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge color={tone.badge}>{display.tier}</Badge>
                <span className="text-xs font-bold tabular-nums text-slate-500">{display.score}/100</span>
              </div>
              <h3 className="mt-0.5 text-sm font-bold text-slate-900">{display.statusText}</h3>
            </div>
          </div>
          {display.classification && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {display.classification}
            </div>
          )}
        </div>

        {display.confidence && <p className="mt-2 text-xs text-slate-500">Confidence: {display.confidence}</p>}

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className={cx('h-full rounded-full', tone.bar)} style={{ width: `${Math.max(3, Math.min(100, display.score))}%` }} />
        </div>

        {display.indicators?.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Indicators</p>
            <div className="flex flex-wrap gap-1.5">
              {display.indicators.map((s, i) => (
                <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{s}</span>
              ))}
            </div>
          </div>
        )}

        {display.evidence?.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Evidence</p>
            <ul className="space-y-1.5">
              {display.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />{e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {display.recommendation && (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recommended action</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{display.recommendation}</p>
          </div>
        )}

        {display.note && <p className="mt-3 text-xs text-slate-400">{display.note}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
        {savedId && (
          <span className="mr-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved to Screening History · {savedId}
          </span>
        )}
        {onViewReport && savedId && (
          <Button variant="secondary" className="!px-3 !py-2 text-xs" onClick={onViewReport}>
            <FileText className="h-3.5 w-3.5" /> View report
          </Button>
        )}
        {onRunNew && (
          <Button className="!px-3 !py-2 text-xs" onClick={onRunNew}>
            <RefreshCw className="h-3.5 w-3.5" /> Run new scan
          </Button>
        )}
      </div>
    </Card>
  );
}

const INPUT_STYLES = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20';

export function OperationInput({ as = 'input', label, hint, error, children, ...rest }) {
  const Tag = as;
  return (
    <div>
      <label className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </label>
      <Tag className={INPUT_STYLES} {...rest} />
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  );
}