import { useMemo, useState } from 'react';
import {
  LayoutDashboard, ScanLine, BellRing, Activity,
  User, UserCheck, ShieldCheck, AlertTriangle, Fingerprint, Settings as SettingsIcon,
  Lock, Globe, Monitor, Trash2, LogOut, Check, KeyRound
} from 'lucide-react';
import {
  Badge, Button, Card, cx, PageHeader, EmptyState,
  MetricCard, SectionHeader, DonutChart
} from '../components/ui';
import { getHistory, getAlerts, clearHistory, formatTime, tierMeta, kpisFromHistory, threatCategory } from '../lib/store';
import { RiskBadge, SeverityBadge } from '../components/Detection';
import { listLanguages } from '../i18n';
import { toast } from '../components/Toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'account', label: 'Account', icon: SettingsIcon },
];

export default function UserProfile({ onNavigate, officer, health, lang, setLang, tab: initialTab = 'overview' }) {
  const [tab, setTab] = useState(initialTab);

  const screenings = useMemo(() => getHistory(), []);
  const alerts = useMemo(() => getAlerts(), []);
  const kpis = useMemo(() => kpisFromHistory(), []);

  return (
    <div className="workspace">
      <div className="flex w-full flex-col gap-5">
        <PageHeader
          eyebrow="Personal workspace"
          title="AegisBorder AI · User Profile"
          subtitle="Your screenings, cases, alerts and operational activity in one place."
          accent="system"
          icon={User}
        />

        <ProfileBanner officer={officer} onEdit={() => setTab('account')} health={health} />

        <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Profile sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={cx('flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-colors',
                tab === id ? 'bg-navy-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <Overview {...{ onNavigate, officer, screenings, alerts, kpis }} />}
        {tab === 'activity' && <ActivityTab {...{ screenings, alerts }} />}
        {tab === 'account' && <AccountTab {...{ onNavigate, officer, lang, setLang, health }} />}
      </div>
    </div>
  );
}

function initials(name) {
  return (name || 'O').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function ProfileBanner({ officer, onEdit, health }) {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-navy-900 text-lg font-extrabold text-white" aria-hidden="true">
          {initials(officer.name)}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-extrabold text-navy-900">{officer.name}</h2>
            <Badge color="green">Active</Badge>
          </div>
          <p className="text-xs font-mono text-slate-400">{officer.id}</p>
          <p className="mt-0.5 text-xs text-slate-500">{officer.checkpoint} · Immigration Officer</p>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 lg:hidden xl:flex">
          <ShieldCheck className="h-4 w-4 text-navy-700" aria-hidden="true" />
          <span className="text-xs font-bold text-slate-700">Secure session</span>
          <span className="text-[10px] text-slate-400">· {health?.state === 'online' ? 'Backend online' : 'Session-local mode'}</span>
        </div>
      </div>
      <Button variant="secondary" onClick={onEdit} className="justify-center">
        <SettingsIcon className="h-4 w-4" /> Edit profile &amp; settings
      </Button>
    </div>
  );
}

function Overview({ onNavigate, screenings, alerts, kpis }) {
  const unread = alerts.filter((a) => !a.resolution).length;
  const flagged = screenings.filter((r) => tierMeta(r.riskTier).order >= 2 || r.watchlistFlagged);
  const pending = alerts.filter((a) => !a.resolution).slice(0, 5);
  const recent = screenings.slice(0, 6);

  const riskSegments = [
    { label: 'Low', value: screenings.filter((r) => tierMeta(r.riskTier).order === 0).length, color: '#10b981' },
    { label: 'Review', value: screenings.filter((r) => tierMeta(r.riskTier).order === 1).length, color: '#f59e0b' },
    { label: 'Flagged', value: screenings.filter((r) => tierMeta(r.riskTier).order === 2).length, color: '#f97316' },
    { label: 'Critical', value: screenings.filter((r) => r.riskTier === 'CRITICAL').length, color: '#ef4444' },
  ].filter((s) => s.value > 0);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard icon={ScanLine} label="Screenings" value={kpis.screened} tone="navy" hint="This session" />
        <MetricCard icon={UserCheck} label="Verified" value={kpis.cleared} tone="emerald" hint="Cleared" />
        <MetricCard icon={AlertTriangle} label="Pending review" value={kpis.review} tone="amber" hint="Moderate risk" />
        <MetricCard icon={ShieldCheck} label="Flagged cases" value={kpis.alerts} tone="red" hint="Attention" />
        <MetricCard icon={BellRing} label="Unread alerts" value={unread} tone="orange" hint="In alert center" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeader icon={ScanLine} title="Recent screenings" actions={
            <button onClick={() => onNavigate('history')} className="text-xs font-bold text-navy-700 hover:underline">View all</button>
          } />
          {recent.length === 0 ? (
            <EmptyState icon={ScanLine} title="No screenings yet" hint="Run a screening to see it here." actionLabel="Start screening" onAction={() => onNavigate('screening')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <Fingerprint className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-navy-900">{r.person}</p>
                    <p className="text-[11px] text-slate-400">{r.id} · {formatTime(r.ts)} · {threatCategory(r)}</p>
                  </div>
                  <RiskBadge tier={r.riskTier} />
                  <button onClick={() => onNavigate('history')} className="text-xs font-bold text-navy-700 hover:underline">Open</button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionHeader icon={BellRing} title="Requires your attention" actions={
            <button onClick={() => onNavigate('alerts')} className="text-xs font-bold text-navy-700 hover:underline">Alerts</button>
          } />
          {pending.length === 0 ? (
            <EmptyState icon={BellRing} title="All clear" hint="No unhandled alerts." small />
          ) : (
            <ul className="space-y-2">
              {pending.map((a) => (
                <li key={a.id} className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                  <SeverityBadge severity={a.severity} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-navy-900">{a.title}</p>
                    <p className="text-[11px] text-slate-400">{a.person || a.id}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {flagged.length > 0 && (
            <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3">
              <p className="text-xs font-extrabold text-orange-800">{flagged.length} flagged {flagged.length === 1 ? 'case' : 'cases'}</p>
              <button onClick={() => onNavigate('history')} className="mt-1 text-xs font-bold text-orange-800 hover:underline">Review in history</button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <SectionHeader icon={ShieldCheck} title="Risk distribution" />
          {riskSegments.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No data yet" hint="Run screenings to see risk distribution." small />
          ) : (
            <>
              <DonutChart segments={riskSegments} centerValue={screenings.length} centerLabel="Total" label="Risk distribution" size={168} />
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {riskSegments.map((s) => (
                  <span key={s.label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label} {s.value}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionHeader icon={LayoutDashboard} title="Quick actions" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onNavigate('screening')}><ScanLine className="h-4 w-4" /> New screening</Button>
            <Button variant="secondary" onClick={() => onNavigate('dashboard')}><LayoutDashboard className="h-4 w-4" /> Dashboard</Button>
            <Button variant="secondary" onClick={() => onNavigate('analytics')}><Activity className="h-4 w-4" /> Analytics</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-slate-400">
            <span>{screenings.length} total screenings</span>
            <span>{alerts.length} alerts</span>
            <span>{unread} unread</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ActivityTab({ screenings, alerts }) {
  const items = useMemo(() => {
    const list = [
      ...screenings.map((r) => ({
        ts: r.ts, kind: 'screening', icon: ScanLine, tone: 'text-navy-600',
        title: `Screening performed — ${r.person}`,
        detail: `${threatCategory(r)} · ${r.decision} · ${r.id}`,
        badge: <RiskBadge tier={r.riskTier} />,
      })),
      ...alerts.map((a) => ({
        ts: a.ts, kind: 'alert', icon: BellRing, tone: 'text-orange-600',
        title: `Alert raised — ${a.title}`,
        detail: a.person || a.id,
        badge: <SeverityBadge severity={a.severity} />,
      })),
    ];
    return list.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  }, [screenings, alerts]);

  const [kind, setKind] = useState('all');
  const filtered = items.filter((i) => kind === 'all' || i.kind === kind);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard icon={ScanLine} label="Screenings" value={screenings.length} tone="navy" />
        <MetricCard icon={BellRing} label="Alerts" value={alerts.length} tone="orange" />
      </div>
      <SectionHeader icon={Activity} title="Activity timeline" />
      <div>
        <button onClick={() => setKind('all')} className={cx('rounded-md border px-3 py-1.5 text-xs font-bold', kind === 'all' ? 'border-navy-800 bg-navy-800 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}>All</button>{' '}
        <button onClick={() => setKind('screening')} className={cx('rounded-md border px-3 py-1.5 text-xs font-bold', kind === 'screening' ? 'border-navy-800 bg-navy-800 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}>Screenings</button>{' '}
        <button onClick={() => setKind('alert')} className={cx('rounded-md border px-3 py-1.5 text-xs font-bold', kind === 'alert' ? 'border-navy-800 bg-navy-800 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}>Alerts</button>
      </div>
      {filtered.length === 0 ? (
        <Card className="p-6"><EmptyState icon={Activity} title="No activity yet" hint="Screening activity appears here as you work." /></Card>
      ) : (
        <ol className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {filtered.slice(0, 40).map((x, i) => {
            const Icon = x.icon;
            return (
              <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                <span className="flex flex-col items-center" aria-hidden="true">
                  <span className={cx('flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white', x.tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {i < filtered.slice(0, 40).length - 1 && <span className="w-px flex-1 bg-slate-200" />}
                </span>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-navy-900">{x.title}</p>
                    <span className="text-[11px] text-slate-400">{formatTime(x.ts)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{x.detail}</p>
                  <div className="mt-1.5">{x.badge}</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function AccountTab({ onNavigate, officer, lang, setLang, health }) {
  const [name, setName] = useState(officer.name);
  const [checkpoint, setCheckpoint] = useState(officer.checkpoint);
  const [motion, setMotion] = useState(() => localStorage.getItem('rakshak_reduced_motion') === '1');
  const [savedId, setSavedId] = useState(null);
  const langs = listLanguages();

  const save = (section) => {
    if (section === 'officer') localStorage.setItem('rakshak_officer', JSON.stringify({ ...officer, name, checkpoint }));
    if (section === 'motion') {
      localStorage.setItem('rakshak_reduced_motion', motion ? '1' : '0');
      document.documentElement.classList.toggle('reduce-motion', motion);
    }
    setSavedId(section);
    setTimeout(() => setSavedId(null), 1800);
    toast('Preferences saved.', { type: 'success', title: 'Saved' });
  };

  const reset = () => {
    clearHistory();
    window.dispatchEvent(new Event('rakshak-store-update'));
    toast('Screening history cleared.', { type: 'info', title: 'Workspace reset' });
    onNavigate('dashboard');
  };

  const signOut = () => {
    localStorage.removeItem('rakshak_officer');
    toast('Signed out of this workspace.', { type: 'info', title: 'Session reset' });
    onNavigate('home');
  };

  const savedChip = (id) => savedId === id && <Badge color="green"><Check className="h-3 w-3" /> Saved</Badge>;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-navy-700" aria-hidden="true" />
          <h3 className="text-sm font-bold text-navy-900">Profile</h3>
          <span className="ml-auto">{savedChip('officer')}</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="ctl-label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="ctl-input" />
          </div>
          <div>
            <label className="ctl-label">Officer ID</label>
            <input value={officer.id} disabled className="ctl-input font-mono opacity-60" />
          </div>
          <div className="sm:col-span-2">
            <label className="ctl-label">Checkpoint / counter</label>
            <input value={checkpoint} onChange={(e) => setCheckpoint(e.target.value)} className="ctl-input" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => save('officer')}>Save profile</Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-navy-700" aria-hidden="true" />
          <h3 className="text-sm font-bold text-navy-900">Language</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-3">
          {langs.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)}
              className={cx('rounded-md border px-2 py-1.5 text-left text-xs font-semibold', lang === l.code ? 'border-navy-400 bg-navy-50 text-navy-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
              <span className="block truncate font-bold">{l.native}</span>
              <span className="block truncate text-[10px] text-slate-400">{l.name}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-navy-700" aria-hidden="true" />
          <h3 className="text-sm font-bold text-navy-900">Preferences</h3>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3">
            <div>
              <p className="text-sm font-semibold text-navy-900">Reduced motion</p>
              <p className="text-xs text-slate-500">Minimise animations and transitions across the interface.</p>
            </div>
            <button role="switch" aria-checked={motion} aria-label="Reduced motion" onClick={() => { setMotion(!motion); save('motion'); }}
              className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', motion ? 'bg-navy-800' : 'bg-slate-300')}>
              <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', motion ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <p className="text-sm font-semibold text-navy-900">Workspace data</p>
            <p className="text-xs text-slate-500">All screening records are stored locally for this session only.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="danger" onClick={reset}><Trash2 className="h-4 w-4" /> Clear screening history</Button>
              <Button variant="secondary" onClick={() => onNavigate('settings')}><SettingsIcon className="h-4 w-4" /> System settings</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-navy-700" aria-hidden="true" />
          <h3 className="text-sm font-bold text-navy-900">Security &amp; session</h3>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <dt className="text-xs font-semibold text-slate-500">Session</dt>
            <dd className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Active</dd>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <dt className="text-xs font-semibold text-slate-500">Storage</dt>
            <dd className="text-xs font-bold text-slate-700">Session-local (this device)</dd>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <dt className="text-xs font-semibold text-slate-500">Backend</dt>
            <dd className="text-xs font-bold capitalize text-slate-700">{health?.state || 'checking'}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <dt className="text-xs font-semibold text-slate-500">Officer ID</dt>
            <dd className="font-mono text-xs text-slate-700">{officer.id}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <Button variant="danger" onClick={signOut}><LogOut className="h-4 w-4" /> Reset session</Button>
        </div>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-navy-700" aria-hidden="true" />
          <h3 className="text-sm font-bold text-navy-900">App session</h3>
          <span className="ml-auto text-xs text-slate-400">Current version 1.0.0</span>
        </div>
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          This workspace stores screening history, alerts and officer details in local browser storage so records persist for the current session.
          No data leaves this device unless an operation explicitly requires the backend. Sign out to reset the session.
        </div>
      </Card>
    </div>
  );
}