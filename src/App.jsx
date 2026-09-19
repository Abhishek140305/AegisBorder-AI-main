import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Suspense, lazy } from 'react';
import {
  LayoutDashboard, ScanLine, History as HistoryIcon, BellRing, BarChart3,
  Settings as SettingsIcon, Shield, Menu, X, MoreHorizontal, AlertTriangle, Plus, Globe, LifeBuoy, User, Home as HomeIcon
} from 'lucide-react';
import { apiHealth } from './lib/api';
import { getAlerts, getHistory, tierMeta, useStore } from './lib/store';
import { cx, accent } from './components/ui';
import { SeverityBadge } from './components/Detection';
import { toast, ToastHost } from './components/Toast';
import { useT, listLanguages } from './i18n';
import GuideChat from './components/GuideChat';
import ErrorBoundary from './components/ErrorBoundary';

import Home from './pages/public/Home';
import Features from './pages/public/Features';
import VerificationLanding from './pages/public/VerificationLanding';
import { VERIFICATIONS } from './pages/public/verifications';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import UserProfile from './pages/UserProfile';
import Dashboard from './pages/Dashboard';
import NewOperation from './pages/NewOperation';
import History from './pages/History';
import Alerts from './pages/Alerts';
import SettingsPage from './pages/Settings';
const Analytics = lazy(() => import('./pages/Analytics'));

const PRIMARY_NAV = [
  { id: 'dashboard', label: 'nav_dashboard', icon: LayoutDashboard, accent: 'system' },
  { id: 'screening', label: 'nav_screening', icon: ScanLine, accent: 'document' },
  { id: 'history', label: 'nav_history', icon: HistoryIcon, accent: 'identity' },
  { id: 'alerts', label: 'nav_alerts', icon: BellRing, accent: 'threat' },
  { id: 'analytics', label: 'nav_analytics', icon: BarChart3, accent: 'analytics' },
  { id: 'settings', label: 'nav_settings', icon: SettingsIcon, accent: 'system' },
];

const SITE_TABS = [
  { id: 'home', label: 'nav_home' },
  { id: 'features', label: 'nav_features' },
  { id: 'about', label: 'nav_about' },
  { id: 'contact', label: 'nav_contact' },
  { id: 'profile', label: 'nav_profile' },
];

function LanguageSwitcher({ lang, setLang }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  const langs = listLanguages();
  const current = langs.find((l) => l.code === lang) || langs[0];
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        title={t('selected_language')}>
        <Globe className="h-3.5 w-3.5 text-navy-700" />
        <span className="max-w-[5rem] truncate">{current.native}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-80 w-60 overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5 shadow-xl">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('select_language')}</p>
          {langs.map((l) => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
              className={cx('flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-slate-100',
                l.code === lang ? 'font-bold text-navy-800' : 'text-slate-700')}>
              <span>{l.native}</span>
              <span className="text-[10px] text-slate-400">{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useHealth() {
  const { t } = useT();
  const [health, setHealth] = useState({ state: 'checking', modules: [], version: null });
  const wasOnlineRef = useRef(null);
  const check = useCallback(async () => {
    try {
      const data = await apiHealth();
      setHealth({ state: 'online', modules: data.modules_active || [], version: data.version });
      if (wasOnlineRef.current === false) toast(t('toast_backend_online'), { type: 'success', title: t('toast_conn_restored') });
      wasOnlineRef.current = true;
    } catch {
      setHealth((h) => ({ ...h, state: 'offline' }));
      if (wasOnlineRef.current !== false) toast(t('toast_backend_unreachable'), { type: 'error', title: t('backend_offline') });
      wasOnlineRef.current = false;
    }
  }, [t]);
  useEffect(() => {
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [check]);
  return { state: health.state, modules: health.modules, version: health.version, refresh: check };
}

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <time className="hidden font-mono text-xs text-slate-500 xl:inline" dateTime={now.toISOString()}>
      {now.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })} · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </time>
  );
}

function Brand({ compact }) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy-900 text-white shadow-sm" aria-hidden="true">
        <Shield className="h-5 w-5" />
      </div>
      <div className={cx(compact && 'hidden sm:block')}>
        <div className="text-sm font-extrabold leading-tight tracking-tight text-navy-900 sm:text-[15px]">{t('app_name')}</div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t('app_subtitle')}</div>
      </div>
    </div>
  );
}

function Footer({ navigate, health, version, officer, lang }) {
  const { t } = useT();
  const healthDot = health.state === 'online' ? 'bg-emerald-400' : health.state === 'offline' ? 'bg-red-400' : 'bg-amber-400';
  const healthLabel = t(health.state === 'online' ? 'all_operational' : health.state === 'offline' ? 'backend_offline' : 'checking');
  const siteLinks = [
    { id: 'home', label: t('nav_home') },
    { id: 'features', label: t('nav_features') },
    { id: 'about', label: t('nav_about') },
    { id: 'contact', label: t('nav_contact') },
    { id: 'profile', label: t('nav_profile') },
  ];
  const links = [
    { id: 'dashboard', label: t('nav_dashboard') },
    { id: 'screening', label: t('nav_screening') },
    { id: 'history', label: t('nav_history') },
    { id: 'alerts', label: t('nav_alerts') },
    { id: 'analytics', label: t('nav_analytics') },
  ];
  return (
    <footer className="site-footer mt-auto">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 md:grid-cols-4 lg:px-6">
        <div>
          <Brand />
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
            {t('operation_subtitle')}
          </p>
        </div>
        <nav aria-label="Site navigation">
          <h3 className="mb-3">Platform</h3>
          <ul className="space-y-2 text-sm">
            {siteLinks.map((l) => (
              <li key={l.id}>
                <button onClick={() => navigate(l.id)} className="font-medium hover:underline">{l.label}</button>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer">
          <h3 className="mb-3">{t('footer_quick')}</h3>
          <ul className="space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.id}>
                <button onClick={() => navigate(l.id)} className="font-medium hover:underline">{l.label}</button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-sm">
          <h3 className="mb-3">{t('footer_system')}</h3>
          <dl className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
              <dt className="text-slate-500">{t('version_label')}</dt>
              <dd className="font-mono text-slate-300">{version || '1.0.0'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
              <dt className="text-slate-500">{t('system_status')}</dt>
              <dd className="flex items-center gap-1.5 text-slate-300">
                <span className={cx('h-2 w-2 rounded-full', healthDot)} aria-hidden="true" /> {healthLabel}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{t('last_updated')}</dt>
              <dd className="font-mono text-slate-300">{new Date().toLocaleDateString()}</dd>
            </div>
          </dl>
          <button onClick={() => navigate('settings')} className="mt-4 text-xs font-semibold underline-offset-2 hover:underline">
            {t('footer_security_settings')}
          </button>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1400px] space-y-2 px-4 py-5 text-[11px] leading-relaxed text-slate-500 lg:px-6">
          <p><strong className="text-slate-400">{t('footer_rights')}</strong></p>
          <p>{t('footer_disclaimer')}</p>
          <p>{t('footer_session')} · Officer {officer.id} · {lang}</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const { lang, t, setLang } = useT();
  const [route, setRoute] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreSheet, setMoreSheet] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileTab, setProfileTab] = useState(null);
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('rakshak_demo') === '1');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const health = useHealth();
  const history = useStore(getHistory);
  const alerts = useStore(getAlerts);

  const officer = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('rakshak_officer')) || { name: 'Officer A. Sharma', id: 'OFFICER-7419', checkpoint: 'DELHI-IGI-T3-COUNTER-14' };
    } catch {
      return { name: 'Officer A. Sharma', id: 'OFFICER-7419', checkpoint: 'DELHI-IGI-T3-COUNTER-14' };
    }
  }, []);

  const alertCount = useMemo(() => getAlerts().filter((a) => !a.resolution).length, [alerts]);

  const recentAlerts = useMemo(() => getAlerts().filter((a) => !a.resolution).sort((x, y) => new Date(y.ts) - new Date(x.ts)).slice(0, 5), [alerts]);

  const scanStats = useMemo(() => {
    const today = new Date().toDateString();
    const list = getHistory();
    const todayScans = list.filter((r) => new Date(r.ts).toDateString() === today);
    return {
      today: todayScans.length,
      clearedToday: todayScans.filter((r) => tierMeta(r.riskTier).order === 0).length,
      flaggedToday: todayScans.filter((r) => tierMeta(r.riskTier).order >= 2 || r.watchlistFlagged).length,
    };
  }, [history]);

  const critical = useMemo(() => {
    const latest = getHistory()[0];
    if (!latest || bannerDismissed) return null;
    if (latest.watchlistFlagged || latest.riskTier === 'CRITICAL') return latest;
    return null;
  }, [history, bannerDismissed]);

  const navigate = (id) => {
    setRoute(id);
    setSidebarOpen(false);
    setMoreSheet(false);
    setNotifOpen(false);
  };

  const healthDot = health.state === 'online' ? 'bg-emerald-400' : health.state === 'offline' ? 'bg-red-500' : 'bg-amber-400';
  const healthLabel = t(health.state === 'online' ? 'all_operational' : health.state === 'offline' ? 'backend_offline' : 'checking');
  const helpAction = () => toast(t('guide_hello'), { type: 'info', title: t('guide_title') });

  const MobileMoreSheet = moreSheet && (
    <div className="fixed inset-0 z-50 flex items-end lg:hidden" role="dialog" aria-modal="true" aria-label="More options">
      <div className="absolute inset-0 bg-navy-950/60" aria-hidden="true" onClick={() => setMoreSheet(false)} />
      <div className="relative z-10 w-full rounded-t-xl bg-white p-4 pb-8 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">{t('more')}</h2>
          <button onClick={() => setMoreSheet(false)} aria-label="Close" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'profile', label: t('nav_profile'), icon: User, primary: true },
            { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
            { id: 'screening', label: t('nav_screening'), icon: ScanLine },
            { id: 'history', label: t('nav_history'), icon: HistoryIcon },
            { id: 'alerts', label: t('nav_alerts'), icon: BellRing },
            { id: 'analytics', label: t('nav_analytics'), icon: BarChart3 },
            { id: 'settings', label: t('nav_settings'), icon: SettingsIcon },
          ].map(({ id, label, icon: Icon, primary }) => (
            <button key={id} onClick={() => navigate(id)} className={cx('flex items-center gap-3 rounded-md border px-4 py-3 text-sm font-semibold', primary ? 'border-navy-800 bg-navy-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-blue-50')}>
              <Icon className="h-5 w-5" /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9] text-slate-900">
      {/* Utility bar */}
      <div className="util-bar">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-1.5 text-[11px] lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Shield className="h-3 w-3 shrink-0 text-navy-400" aria-hidden="true" />
            <span className="truncate font-bold uppercase tracking-widest">{t('utility_portal')}</span>
            {demoMode && <span className="hidden shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 font-bold text-amber-300 sm:inline">{t('demo_mode')}</span>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={cx('h-2 w-2 rounded-full', healthDot)} aria-hidden="true" />
              <span className="hidden sm:inline">{healthLabel}</span>
            </span>
            <span className="hidden text-slate-600 md:inline">
              {t('version_label')} {health.version || '—'}
            </span>
            <span className="hidden text-slate-600 lg:inline">
              <Clock />
            </span>
            <button onClick={helpAction} className="flex items-center gap-1 font-semibold" aria-label={t('help_support')}>
              <LifeBuoy className="h-3 w-3" aria-hidden="true" /> <span className="hidden sm:inline">{t('help_support')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institutional header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-6">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 xl:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
              <Brand />
            </div>

            <nav className="hidden items-center justify-center gap-0.5 lg:flex" aria-label="Site pages">
              {SITE_TABS.map(({ id, label }) => (
                <button key={id} onClick={() => { if (id === 'profile') setProfileTab(null); navigate(id); }} aria-current={route === id ? 'page' : undefined}
                  className={cx('rounded-md px-3 py-1.5 text-sm font-bold transition-colors',
                    route === id ? 'bg-navy-50 text-navy-900' : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900')}>
                  {t(label)}
                </button>
              ))}
            </nav>

            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
              <div className="relative hidden sm:block">
                <button onClick={() => setNotifOpen((v) => !v)} aria-haspopup="true" aria-expanded={notifOpen} aria-label={t('nav_alerts')} title={t('nav_alerts')}
                  className={cx('relative rounded-md p-2 text-slate-600 hover:bg-slate-100', notifOpen && 'bg-slate-100')}>
                  <BellRing className="h-[18px] w-[18px]" />
                  {alertCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">{alertCount}</span>}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                      <p className="text-xs font-bold text-navy-900">Notifications</p>
                      <span className="rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-bold text-white">{alertCount} unread</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto" role="list">
                      {recentAlerts.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-500">No unhandled alerts.</p>
                      ) : recentAlerts.map((a) => (
                        <button key={a.id} onClick={() => { setNotifOpen(false); setProfileTab('alerts'); navigate('profile'); }}
                          className="flex w-full items-start gap-2.5 border-b border-slate-100 px-4 py-2.5 text-left hover:bg-slate-50">
                          <SeverityBadge severity={a.severity} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold text-navy-900">{a.title}</span>
                            <span className="block text-[11px] text-slate-400">{a.person || a.id}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => { setNotifOpen(false); setProfileTab('alerts'); navigate('profile'); }}
                      className="block w-full border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-xs font-bold text-navy-800 hover:bg-slate-100">
                      View all alerts →
                    </button>
                  </div>
                )}
              </div>
              <LanguageSwitcher lang={lang} setLang={setLang} />
              <div className="hidden items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 2xl:flex" title={t('scans_today')}>
                <ScanLine className="h-3.5 w-3.5 text-navy-700" aria-hidden="true" />
                <span className="text-xs font-bold text-slate-800">{scanStats.today}</span>
                <span className="text-[10px] text-slate-400">{t('scans_today')}</span>
              </div>
              <div className={cx('hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 2xl:flex', scanStats.flaggedToday > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50')} title={t('flagged_today')}>
                <AlertTriangle className={cx('h-3.5 w-3.5', scanStats.flaggedToday > 0 ? 'text-red-600' : 'text-slate-400')} aria-hidden="true" />
                <span className={cx('text-xs font-bold', scanStats.flaggedToday > 0 ? 'text-red-700' : 'text-slate-600')}>{scanStats.flaggedToday}</span>
              </div>
              <button onClick={() => navigate('screening')}
                className="hidden items-center gap-1.5 rounded-md bg-navy-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-navy-900 sm:flex">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {t('new_entry')}
              </button>
              <button onClick={() => navigate('profile')} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white py-1 pl-1 pr-2.5 shadow-sm transition-colors hover:bg-slate-50" title={officer.id}>
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy-900 text-[10px] font-bold text-white" aria-hidden="true">
                  {(officer.name || 'O').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <span className="hidden text-left xl:block">
                  <span className="block max-w-[9rem] truncate text-xs font-bold leading-tight text-slate-800">{officer.name}</span>
                  <span className="block text-[10px] leading-tight text-slate-400">{t('role_immigration_officer')}</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5" aria-hidden="true">
          <span className="block h-full bg-gradient-to-r from-navy-900 via-navy-600 to-navy-900" />
        </div>
      </header>

      {critical && (
        <div className="critical-flicker z-20 flex items-center gap-3 bg-red-800 px-4 py-2 text-sm font-bold text-white">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">
            {t('critical_alert_banner', { person: critical.person || t('passenger_label'), tier: critical.riskTier, score: critical.riskScore })}{critical.watchlistFlagged ? t('watchlist_match_suffix') : ''}
          </span>
          <button className="shrink-0 rounded px-2 py-0.5 text-xs font-bold text-white/90 hover:bg-white/20" onClick={() => setBannerDismissed(true)}>{t('dismiss')}</button>
        </div>
      )}

      {/* Mobile nav drawer */}
      <div className={cx('fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform xl:hidden', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <Brand />
          <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile primary">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">AegisBorder AI</p>
          <ul className="space-y-1">
            {SITE_TABS.map(({ id, label }) => {
              const active = route === id;
              return (
                <li key={id}>
                  <button onClick={() => navigate(id)}
                    className={cx('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors',
                      active ? 'bg-navy-800 text-white' : 'text-slate-600 hover:bg-slate-100')}>
                    <span className="flex-1 text-left">{t(label)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mb-2 mt-4 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('operations')}</p>
          <ul className="space-y-1">
            {PRIMARY_NAV.map(({ id, icon: Icon, accent: a }) => {
              const active = route === id;
              const ac = accent(a);
              return (
                <li key={id}>
                  <button onClick={() => navigate(id)}
                    className={cx('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors',
                      active ? 'bg-navy-800 text-white' : 'text-slate-600 hover:bg-slate-100')}>
                    <Icon className={cx('h-[18px] w-[18px]', active ? 'text-white' : ac.text)} />
                    <span className="flex-1 text-left">{t('nav_' + id)}</span>
                    {id === 'alerts' && alertCount > 0 && (
                      <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', active ? 'bg-white text-navy-800' : 'bg-red-100 text-red-700')}>{alertCount}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-slate-200 px-4 py-3">
          <div className="text-xs font-semibold text-slate-800">{officer.name}</div>
          <div className="text-[10px] font-mono text-slate-400">{officer.id}</div>
          <div className="mt-1 text-[10px] text-slate-400">{officer.checkpoint}</div>
        </div>
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-navy-950/50 xl:hidden" aria-hidden="true" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 pb-10">
        {route === 'home' && <Home onNavigate={navigate} />}
        {route === 'features' && <Features onNavigate={navigate} />}
        {route === 'about' && <About onNavigate={navigate} />}
        {route === 'contact' && <Contact />}
        {VERIFICATIONS.map((v) => route === v.kind && <VerificationLanding key={v.kind} kind={v.kind} onNavigate={navigate} />)}
        {route === 'profile' && (
          <ErrorBoundary key={profileTab || 'default'}>
            <UserProfile onNavigate={navigate} officer={officer} health={health} lang={lang} setLang={setLang} tab={profileTab} />
          </ErrorBoundary>
        )}
        {route === 'dashboard' && <Dashboard onNavigate={navigate} officer={officer} demoMode={demoMode} />}
        {route === 'screening' && <NewOperation healthState={health} onRefresh={health.refresh} />}
        {route === 'history' && <History />}
        {route === 'alerts' && <Alerts />}
        {route === 'settings' && <SettingsPage demoMode={demoMode} setDemoMode={setDemoMode} health={health} />}
        {route === 'analytics' && (
          <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">{t('loading_analytics')}</div>}>
            <Analytics />
          </Suspense>
        )}
      </main>

      <Footer navigate={navigate} health={health} version={health.version} officer={officer} lang={lang} />

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white xl:hidden" aria-label="Mobile">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {[
            { id: 'home', label: t('nav_home'), icon: HomeIcon },
            { id: 'features', label: t('nav_features'), icon: ScanLine },
            { id: 'about', label: t('nav_about'), icon: Shield },
            { id: 'contact', label: t('nav_contact'), icon: LifeBuoy },
            { id: 'more', label: t('more'), icon: MoreHorizontal },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => (id === 'more' ? setMoreSheet(true) : navigate(id))}
              className={cx('flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold', route === id ? 'text-navy-800' : 'text-slate-500')}>
              <span className="relative">
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {MobileMoreSheet}
      <ToastHost />
      <GuideChat />
    </div>
  );
}