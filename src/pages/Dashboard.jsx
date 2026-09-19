import { useEffect, useState } from 'react';
import {
  ScanLine, FileText, ScanFace, ClipboardList, ShieldAlert, BellRing, AlertTriangle,
  ArrowRight, Radio, ShieldCheck, CheckCircle2, Flag
} from 'lucide-react';
import {
  Badge, Button, Card, EmptyState, StatusDot, PageHeader, MetricCard, DonutChart,
  MiniBarChart, SeverityScale
} from '../components/ui';
import { getHistory, formatTime, kpisFromHistory, tierMeta, analyticsFromHistory, OPERATION_LABELS, useStore } from '../lib/store';
import { apiHealth } from '../lib/api';
import { useT } from '../i18n';

const TIER_FILL = { LOW: '#059669', MODERATE: '#d97706', HIGH: '#ea580c', CRITICAL: '#dc2626' };
const TIER_ORDER = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

function periodSplit(list) {
  const since = Date.now() - 24 * 3600 * 1000;
  let recent = 0, older = 0;
  for (const r of list) {
    if (new Date(r.ts).getTime() >= since) recent += 1;
    else older += 1;
  }
  return { recent, older, delta: recent - older };
}

function ScreeningType({ r }) {
  if (r.operationType) return OPERATION_LABELS[r.operationType] || r.operationType;
  return 'Document & Identity Screening';
}

function ReviewStatus({ r, t }) {
  if (r.watchlistFlagged) return <Badge color="red"><Flag className="h-3 w-3" /> {t('watchlist')}</Badge>;
  const meta = tierMeta(r.riskTier);
  const label = meta.order === 0 ? t('verified') : meta.order === 1 ? t('review_required') : t('investigation');
  return <Badge color={meta.color}>{label}</Badge>;
}

export default function Dashboard({ onNavigate, demoMode }) {
  const { t } = useT();
  const history = useStore(getHistory);
  const kpis = kpisFromHistory();
  const data = analyticsFromHistory();
  const [health, setHealth] = useState('checking');

  useEffect(() => {
    apiHealth()
      .then(() => setHealth('online'))
      .catch(() => setHealth('offline'));
  }, []);

  const byTier = data.byTier || {};
  const highRisk = history.filter((r) => r.riskTier === 'HIGH').length;
  const criticalFlags = history.filter((r) => r.riskTier === 'CRITICAL' || r.watchlistFlagged).length;
  const threatSignals = history.filter((r) => r.operationType && (tierMeta(r.riskTier).order >= 2 || r.riskScore >= 50)).length;
  const split = (pred) => periodSplit(history.filter(pred));

  const attention = history
    .filter((r) => tierMeta(r.riskTier).order >= 1 || r.watchlistFlagged)
    .slice(0, 5);

  const recent = history.slice(0, 8);
  const hours = Array.from({ length: 24 }, (_, h) => (data.byHour || {})[h] || 0);

  const riskSegments = TIER_ORDER
    .filter((tr) => (byTier[tr] || 0) > 0)
    .map((tr) => ({ value: byTier[tr] || 0, color: TIER_FILL[tr], label: tr }));

  return (
    <div className="workspace">
      <div className="flex w-full flex-col gap-6">
        {demoMode && (
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span><strong>{t('demo_mode_on')}</strong> {t('demo_mode_desc')}</span>
          </div>
        )}

        <PageHeader
          eyebrow={t('utility_portal')}
          title={t('operational_overview')}
          subtitle={t('operational_overview_sub')}
          accent="system"
          icon={ShieldCheck}
          actions={
            <>
              <Button variant="secondary" onClick={() => onNavigate('history')}>
                <FileText className="h-4 w-4" /> {t('screening_history')}
              </Button>
              <Button onClick={() => onNavigate('screening')}>
                <ScanLine className="h-4 w-4" /> {t('start_screening')}
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard icon={FileText} label={t('metric_docs_screened')} value={kpis.screened}
            tone="document" delta={split(() => true).delta} hint={t('delta_24h')} />
          <MetricCard icon={ScanFace} label={t('metric_identities_verified')} value={kpis.cleared}
            tone="identity" delta={split((r) => tierMeta(r.riskTier).order === 0).delta} hint={t('delta_24h')} />
          <MetricCard icon={ClipboardList} label={t('metric_pending_reviews')} value={kpis.review}
            tone="amber" delta={split((r) => tierMeta(r.riskTier).order === 1).delta} hint={t('delta_24h')} />
          <MetricCard icon={Flag} label={t('metric_high_risk')} value={highRisk}
            tone="orange" delta={split((r) => r.riskTier === 'HIGH').delta} hint={t('delta_24h')} />
          <MetricCard icon={ShieldAlert} label={t('metric_critical_flags')} value={criticalFlags}
            tone="red" delta={split((r) => r.riskTier === 'CRITICAL' || r.watchlistFlagged).delta} hint={t('delta_24h')} />
          <MetricCard icon={BellRing} label={t('metric_threat_signals')} value={threatSignals}
            tone="threat" delta={split((r) => r.operationType && (tierMeta(r.riskTier).order >= 2 || r.riskScore >= 50)).delta} hint={t('delta_24h')} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="section-head px-5 pt-4">
              <h3 className="section-title flex items-center gap-2 text-navy-900">
                <Radio className="h-4 w-4 text-navy-700" aria-hidden="true" /> {t('dashboard_activity')}
              </h3>
              <span className="text-[11px] text-slate-400">{data.total} {t('sessions')}</span>
            </div>
            <div className="p-5">
              {data.total === 0 ? (
                <EmptyState icon={<ScanLine className="h-8 w-8 text-slate-300" />} title={t('no_screenings_yet')} hint={t('no_screenings_hint')} />
              ) : (
                <MiniBarChart values={hours} height={160} color="bg-navy-700"
                  labels={<PeriodLabels />} />
              )}
            </div>
          </Card>

          <Card>
            <div className="section-head px-5 pt-4">
              <h3 className="section-title flex items-center gap-2 text-navy-900">
                <ShieldCheck className="h-4 w-4 text-navy-700" aria-hidden="true" /> {t('dashboard_risk_dist')}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-5 p-5">
              <DonutChart segments={riskSegments} centerLabel={t('total')} centerValue={data.total} label="Risk distribution" />
              <ul className="min-w-36 flex-1 space-y-2 text-sm">
                {TIER_ORDER.map((tr) => {
                  const count = byTier[tr] || 0;
                  const pct = data.total ? Math.round((count / data.total) * 100) : 0;
                  return (
                    <li key={tr} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TIER_FILL[tr] }} aria-hidden="true" />
                        {t('tier_' + tr)}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-slate-700">{count} · {pct}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-2">
            <div className="section-head px-5 pt-4">
              <h3 className="section-title flex items-center gap-2 text-navy-900">
                <ShieldCheck className="h-4 w-4 text-navy-700" aria-hidden="true" /> {t('recent_screening')}
              </h3>
              {history.length > 0 && (
                <button onClick={() => onNavigate('history')} className="flex items-center gap-1 text-xs font-semibold text-navy-700 hover:underline">
                  {t('view_all')} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<ScanLine className="h-8 w-8 text-slate-300" />} title={t('no_screenings_yet')} hint={t('no_screenings_hint')} />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>{t('case')}</th>
                        <th>{t('subject')}</th>
                        <th>{t('screening_type')}</th>
                        <th>{t('risk')}</th>
                        <th>{t('status')}</th>
                        <th>{t('date_time')}</th>
                        <th>{t('officer')}</th>
                        <th className="text-right">{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((r) => {
                        const meta = tierMeta(r.riskTier);
                        return (
                          <tr key={r.id}>
                            <td className="font-mono text-xs text-navy-700">{r.id}</td>
                            <td>
                              <div className="font-semibold text-slate-900">{r.person}</div>
                              <div className="text-xs text-slate-400">{r.documentNumber} · {r.nationality || '—'}</div>
                            </td>
                            <td className="text-xs text-slate-600"><ScreeningType r={r} /></td>
                            <td>
                              <Badge color={meta.color}>{t('tier_' + r.riskTier)}</Badge>
                              <span className="ml-1.5 text-xs font-semibold tabular-nums text-slate-400">{r.riskScore}%</span>
                            </td>
                            <td><ReviewStatus r={r} t={t} /></td>
                            <td className="text-xs tabular-nums text-slate-500">{formatTime(r.ts)}</td>
                            <td className="text-xs text-slate-500">{r.officerStatus ? (r.officerStatus === 'approved' ? t('verified') : r.officerStatus) : '—'}</td>
                            <td className="text-right">
                              <Button variant="secondary" className="!px-2.5 !py-1 text-xs" onClick={() => onNavigate('history')}>
                                {t('view')} <ArrowRight className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="pointer-events-none sticky bottom-0 hidden lg:block">
                  <div className="h-1 bg-gradient-to-t from-slate-100 to-transparent" aria-hidden="true" />
                </div>
              </>
            )}
          </Card>

          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="section-title flex items-center gap-2 text-navy-900">
                  <BellRing className="h-4 w-4 text-red-600" aria-hidden="true" /> {t('needs_attention')}
                </h3>
                <button onClick={() => onNavigate('alerts')} className="flex items-center gap-1 text-xs font-semibold text-navy-700 hover:underline">
                  {t('nav_alerts')} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {attention.length === 0 ? (
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t('no_pending_flags')}
                  </div>
                </Card>
              ) : (
                <div className="space-y-2">
                  {attention.map((r) => {
                    const meta = tierMeta(r.riskTier);
                    return (
                      <Card key={r.id} className="flex items-center gap-3 p-3">
                        <StatusDot color={meta.color} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-900">{r.person}</div>
                          <div className="text-xs text-slate-400">{r.riskScore}% {meta.short} · {r.decision}</div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <Card className="p-4">
              <h3 className="section-title flex items-center gap-2 text-navy-900">
                <Radio className="h-4 w-4 text-navy-700" aria-hidden="true" /> {t('system_health')}
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600"><Radio className="h-4 w-4 text-slate-400" /> {t('screening_engine')}</span>
                  <Badge color={health === 'online' ? 'green' : health === 'offline' ? 'red' : 'amber'}>
                    {health === 'online' ? t('online') : health === 'offline' ? t('offline') : t('checking')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{t('watchlist_verification')}</span>
                  <Badge color={health === 'online' ? 'green' : 'red'}>{health === 'online' ? t('loaded') : t('unavailable')}</Badge>
                </div>
                <p className="pt-1 text-xs text-slate-400">{t('history_note')}</p>
              </div>
            </Card>

            <SeverityScale currentTier={history[0]?.riskTier} labels={{ title: t('risk_scale_title') }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PeriodLabels() {
  return (
    <div className="flex justify-between text-[10px] text-slate-400">
      <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
    </div>
  );
}