import { useEffect, useMemo, useState } from 'react';
import { BellRing, ShieldAlert, ShieldCheck, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { Badge, Button, EmptyState, cx, PageHeader } from '../components/ui';
import { getAlerts, getHistory, resolveAlert, syncAlertsFromHistory, useStore } from '../lib/store';
import { useT } from '../i18n';

const SEVERITY_COLOR = { Critical: 'red', High: 'orange', Moderate: 'amber', Low: 'slate' };
const SEVERITY_ICON = { Critical: ShieldAlert, High: ShieldAlert, Moderate: AlertTriangle, Low: ShieldCheck };

export default function Alerts() {
  const { t } = useT();
  const history = useStore(getHistory);
  const [filter, setFilter] = useState('open');

  useEffect(() => { syncAlertsFromHistory(); }, [history]);
  const alerts = useStore(getAlerts);

  const rows = useMemo(() => {
    return alerts.filter((a) => (filter === 'open' ? !a.resolution : filter === 'resolved' ? !!a.resolution : true));
  }, [alerts, filter]);

  const openCount = alerts.filter((a) => !a.resolution).length;

  return (
    <div className="workspace">
      <div className="flex w-full flex-col gap-5">
        <PageHeader
          eyebrow={t('threat_detection')}
          title={t('alert_title')}
          subtitle={t('alerts_note')}
          accent="threat"
          icon={BellRing}
          actions={
            <span className="chip !border-red-200 !bg-red-50 !text-red-800">
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" /> {openCount} {t('open')}
            </span>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-md border border-slate-300 bg-white p-0.5 text-sm" role="tablist" aria-label={t('alert_title')}>
            {['open', 'resolved', 'all'].map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
                className={cx('rounded-md px-4 py-1 font-semibold capitalize', filter === f ? 'bg-navy-800 text-white' : 'text-slate-600 hover:text-navy-800')}>
                {t('filter_' + f)}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="h-8 w-8 text-slate-300" />} title={t('no_alerts')}
            hint={openCount === 0 ? t('no_alerts_handled') : t('no_alerts_filter')} />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" role="list">
            {rows.map((a) => {
              const color = SEVERITY_COLOR[a.severity] || 'slate';
              const Icon = SEVERITY_ICON[a.severity] || ShieldAlert;
              const resolved = !!a.resolution;
              return (
                <div key={a.id} role="listitem" className={cx('rounded-md border border-slate-200 bg-white p-4 transition-opacity', resolved && 'opacity-70')}>
                  <div className="flex items-start gap-3">
                    <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-md border',
                      resolved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600')}>
                      {resolved ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                        <Badge color={color}>{a.severity}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{a.person} · {a.documentNumber} · {a.id}</p>
                      {a.factors?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {a.factors.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                              <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0 text-red-400" /> {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-slate-400">
                          {t('score_rec', { score: a.riskScore, rec: a.recommended })}
                        </span>
                        {!resolved ? (
                          <div className="flex gap-2">
                            <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => resolveAlert(a.id, 'watching')}>
                              {t('mark_watching')}
                            </Button>
                            <Button variant="success" className="!px-3 !py-1 text-xs" onClick={() => resolveAlert(a.id, 'handled')}>
                              <Shield className="h-3.5 w-3.5" /> {t('mark_handled')}
                            </Button>
                          </div>
                        ) : (
                          <Badge color="green">{a.resolution === 'handled' ? t('handled') : t('watching')} — {a.resolution}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}