import { useMemo } from 'react';
import { BarChart3, CheckCircle2, AlertTriangle, ShieldAlert, FileText, Clock, ScanLine } from 'lucide-react';
import { Card, EmptyState, cx, PageHeader } from '../components/ui';
import { getHistory, analyticsFromHistory, tierMeta, useStore } from '../lib/store';
import { useT } from '../i18n';

function useOpLabels(t) {
  return {
    message: t('op_message'), website: t('op_website'), qr: t('op_qr_upi'), app: t('op_app'),
    registry: t('op_registry'), document: t('op_document'), ai: t('op_ai'),
  };
}

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-right text-xs font-semibold text-slate-500" title={label}>{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-md bg-slate-100">
        <div className={cxBar(color)} style={{ width: `${Math.max(4, pct)}%` }} title={`${value}`} />
      </div>
      <span className="w-8 shrink-0 text-xs font-bold tabular-nums text-slate-700">{value}</span>
    </div>
  );
}

function cxBar(color) {
  const map = { blue: 'bg-navy-700', green: 'bg-emerald-500', amber: 'bg-amber-500', orange: 'bg-orange-500', red: 'bg-red-600', navy: 'bg-navy-700', sky: 'bg-sky-600' };
  return `h-full rounded-md ${map[color] || map.navy}`;
}

function PanelHeader({ icon: Icon, children, accent }) {
  return (
    <div className={cx('mb-4 flex items-center gap-2 border-b border-slate-200 pb-2', accent === 'analytics' && 'text-navy-900')}>
      {Icon && <Icon className="h-4 w-4 text-sky-700" aria-hidden="true" />}
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-600">{children}</h2>
    </div>
  );
}

export default function Analytics() {
  const { t } = useT();
  const OP_LABELS = useOpLabels(t);
  const history = useStore(getHistory);
  const data = useMemo(() => analyticsFromHistory(), [history]);
  const maxTier = Math.max(1, ...Object.values(data.byTier));
  const maxHour = Math.max(1, ...Object.values(data.byHour));

  const hours = Array.from({ length: 24 }, (_, h) => (data.byHour || {})[h] || 0);

  return (
    <div className="workspace">
      <div className="flex w-full flex-col gap-5">
        <PageHeader
          eyebrow={t('analytics_title')}
          title={t('analytics_title')}
          subtitle={t('analytics_note', { count: data.total })}
          accent="analytics"
          icon={BarChart3}
        />

        {data.total === 0 ? (
          <EmptyState icon={<BarChart3 className="h-8 w-8 text-slate-300" />} title={t('no_data_yet')}
            hint={t('no_data_hint')} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat icon={<ScanLine className="h-4 w-4" />} label={t('total_screened')} value={data.total} tone="sky" />
              <Stat icon={<CheckCircle2 className="h-4 w-4" />} label={t('verified_low')} value={data.byTier.LOW} tone="green" />
              <Stat icon={<AlertTriangle className="h-4 w-4" />} label={t('reviewed_moderate')} value={data.byTier.MODERATE} tone="amber" />
              <Stat icon={<ShieldAlert className="h-4 w-4" />} label={t('flag_watchlist')} value={data.failures.watchlistFail} tone="red" />
            </div>

            <Card className="p-5">
              <PanelHeader icon={BarChart3}>{t('outcomes_by_risk')}</PanelHeader>
              <div className="space-y-2">
                {Object.entries(data.byTier).map(([tier, count]) => (
                  <Bar key={tier} label={tierMeta(tier).short} value={count} max={maxTier} color={tierMeta(tier).color} />
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card className="p-5">
                <PanelHeader icon={Clock}>{t('by_hour')}</PanelHeader>
                <div className="flex items-end gap-1" style={{ height: 120 }} aria-hidden="true">
                  {hours.map((v, h) => (
                    <div key={h} className="group relative flex-1">
                      <div className="mx-0.5 rounded-t bg-sky-200 transition-colors hover:bg-sky-500" title={`${h}:00 — ${v || 0}`}
                        style={{ height: `${((v || 0) / maxHour) * 100}%`, minHeight: 2 }} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
              </Card>

              <Card className="p-5">
                <PanelHeader icon={ShieldAlert}>{t('module_flags')}</PanelHeader>
                <div className="space-y-3">
                  <FlagRow icon={<ShieldAlert className="h-4 w-4" />} label={t('flag_face_liveness')} count={data.failures.faceFail} color="red" />
                  <FlagRow icon={<BarChart3 className="h-4 w-4" />} label={t('flag_photo_tamper')} count={data.failures.tamperFail} color="orange" />
                  <FlagRow icon={<AlertTriangle className="h-4 w-4" />} label={t('flag_doc_validation')} count={data.failures.validFail} color="amber" />
                  <FlagRow icon={<AlertTriangle className="h-4 w-4" />} label={t('flag_watchlist')} count={data.failures.watchlistFail} color="red" />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card className="p-5">
                <PanelHeader icon={FileText}>{t('scans_by_operation')}</PanelHeader>
                <div className="space-y-2">
                  {Object.entries(data.byOperation).map(([op, count]) => (
                    <Bar key={op} label={OP_LABELS[op] || op} value={count} max={Math.max(1, ...Object.values(data.byOperation))} color="navy" />
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <PanelHeader icon={AlertTriangle}>{t('threat_distribution')}</PanelHeader>
                <div className="space-y-2">
                  {Object.entries(data.byCategory).map(([cat, count]) => (
                    <Bar key={cat} label={cat} value={count} max={Math.max(1, ...Object.values(data.byCategory))} color="orange" />
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FlagRow({ icon, label, count, color }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-slate-700">{icon} {label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${color === 'red' ? 'bg-red-100 text-red-700' : color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{count}</span>
    </div>
  );
}

const TONE_STAT = {
  sky: 'text-sky-700', green: 'text-emerald-700', amber: 'text-amber-700', red: 'text-red-700', navy: 'text-navy-700',
};

function Stat({ icon, label, value, tone = 'navy' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className={cx('flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50', TONE_STAT[tone])} aria-hidden="true">{icon}</span>
        <div className="text-[26px] font-extrabold leading-none tabular-nums text-navy-900">{value}</div>
      </div>
      <div className="mt-1.5 text-xs font-semibold text-slate-500">{label}</div>
    </Card>
  );
}