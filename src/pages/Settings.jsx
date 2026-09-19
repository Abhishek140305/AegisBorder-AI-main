import { useState } from 'react';
import { User, MapPin, Languages, FlaskConical, Check, Save, Shield, Server, Activity } from 'lucide-react';
import { Badge, Button, Card, cx, PageHeader } from '../components/ui';
import { useT, listLanguages } from '../i18n';

const labelCls = 'mb-1 block text-xs font-semibold text-slate-700';

export default function SettingsPage({ demoMode, setDemoMode, health }) {
  const { lang, setLang, t } = useT();
  const [officer, setOfficer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rakshak_officer')) ||
        { name: 'Officer A. Sharma', id: 'OFFICER-7419', checkpoint: 'DELHI-IGI-T3-COUNTER-14' };
    } catch {
      return { name: 'Officer A. Sharma', id: 'OFFICER-7419', checkpoint: 'DELHI-IGI-T3-COUNTER-14' };
    }
  });
  const [saved, setSaved] = useState(false);

  const saveOfficer = () => {
    localStorage.setItem('rakshak_officer', JSON.stringify(officer));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleDemo = () => {
    const next = !demoMode;
    localStorage.setItem('rakshak_demo', next ? '1' : '0');
    setDemoMode(next);
  };

  const healthState = health?.state || 'checking';

  return (
    <div className="workspace">
      <div className="flex w-full flex-col gap-5">
        <PageHeader
          eyebrow={t('footer_system')}
          title={t('settings_title')}
          subtitle={t('settings_subtitle')}
          accent="system"
          icon={Shield}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700" aria-hidden="true">
                <User className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">{t('officer_profile')}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>{t('officer_name')}</label>
                <input value={officer.name} onChange={(e) => setOfficer({ ...officer, name: e.target.value })} className="ctl-input" />
              </div>
              <div>
                <label className={labelCls}>{t('officer_id')}</label>
                <input value={officer.id} onChange={(e) => setOfficer({ ...officer, id: e.target.value })} className="ctl-input font-mono" />
              </div>
              <div>
                <label className={labelCls}>{t('checkpoint_counter')}</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={officer.checkpoint} onChange={(e) => setOfficer({ ...officer, checkpoint: e.target.value })} className={cx('ctl-input', 'pl-9')} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              {saved && <Badge color="green"><Check className="h-3 w-3" /> {t('saved')}</Badge>}
              <Button onClick={saveOfficer}><Save className="h-4 w-4" /> {t('save_profile')}</Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-700" aria-hidden="true">
                  <FlaskConical className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{t('demo_mode_title')}</h2>
                  <p className="text-xs text-slate-500">{t('demo_mode_hint')}</p>
                </div>
              </div>
              <button onClick={toggleDemo} role="switch" aria-checked={demoMode} aria-label={t('toggle_demo')}
                className={cx('relative h-6 w-11 rounded-full transition-colors', demoMode ? 'bg-navy-800' : 'bg-slate-300')}>
                <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', demoMode ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700" aria-hidden="true">
                <Languages className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">{t('language_title')}</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">{t('language_desc')}</p>
            <div className="mt-3 grid max-h-80 grid-cols-1 overflow-y-auto gap-1 rounded-md border border-slate-200 p-2 sm:grid-cols-2 lg:grid-cols-3">
              {listLanguages().map(({ code, name, native }) => (
                <button key={code} onClick={() => setLang(code)}
                  className={cx('flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100',
                    lang === code ? 'bg-navy-50 font-bold text-navy-800' : 'text-slate-700')}>
                  <span>{native}</span>
                  <span className={cx('text-[11px]', lang === code ? 'text-navy-700' : 'text-slate-400')}>{name}</span>
                  {lang === code && <Check className="h-4 w-4 text-navy-800" />}
                </button>
              ))}
            </div>
          </Card>

          <div className="flex flex-col gap-5">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-700" aria-hidden="true">
                  <Server className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-bold text-slate-900">{t('system_status')}</h2>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-slate-600"><Activity className="h-4 w-4 text-slate-400" /> {t('screening_engine')}</dt>
                  <dd>
                    <Badge color={healthState === 'online' ? 'green' : healthState === 'offline' ? 'red' : 'amber'}>
                      {healthState === 'online' ? t('online') : healthState === 'offline' ? t('offline') : t('checking')}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">{t('version_label')}</dt>
                  <dd className="font-mono text-xs text-slate-500">{health?.version || '1.0.0'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">{t('watchlist_verification')}</dt>
                  <dd><Badge color={healthState === 'online' ? 'green' : 'red'}>{healthState === 'online' ? t('loaded') : t('unavailable')}</Badge></dd>
                </div>
              </dl>
            </Card>

            <Card className="p-5">
              <h2 className="mb-2 text-[13px] font-bold text-slate-900">{t('coming_soon')}</h2>
              <ul className="space-y-1 text-sm text-slate-500">
                <li>• {t('upcoming_db')}</li>
                <li>• {t('upcoming_watchlist')}</li>
                <li>• {t('upcoming_batch')}</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}