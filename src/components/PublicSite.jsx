import { useState } from 'react';
import { Shield, Menu, X, Lock, ExternalLink } from 'lucide-react';
import { cx } from './ui';

export const PUBLIC_ROUTES = ['home', 'features', 'about', 'contact'];

export const PUBLIC_NAV = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export function PublicBrand({ dark }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
        dark ? 'bg-white text-navy-900' : 'bg-navy-900 text-white')} aria-hidden="true">
        <Shield className="h-5 w-5" />
      </div>
      <div>
        <div className={cx('text-[15px] font-extrabold leading-tight tracking-tight', dark ? 'text-white' : 'text-navy-900')}>AegisBorder AI</div>
        <div className={cx('text-[10px] font-semibold uppercase tracking-widest', dark ? 'text-navy-200' : 'text-slate-400')}>
          Smart Border Document &amp; Identity Screening System
        </div>
      </div>
    </div>
  );
}

export function PublicHeader({ route, onNavigate }) {
  const [open, setOpen] = useState(false);
  const go = (id) => { setOpen(false); onNavigate(id); };
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <button onClick={() => go('home')} className="text-left" aria-label="AegisBorder AI — home">
          <PublicBrand />
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Public main navigation">
          {PUBLIC_NAV.map(({ id, label }) => (
            <button key={id} onClick={() => go(id)} aria-current={route === id ? 'page' : undefined}
              className={cx('rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                route === id ? 'bg-navy-50 text-navy-900' : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900')}>
              {label}
            </button>
          ))}
        </nav>

        <button onClick={() => go('dashboard')}
          className="flex items-center gap-1.5 rounded-md bg-navy-800 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-navy-900">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Secure Portal</span>
          <span className="sm:hidden">Portal</span>
        </button>

        <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 pb-3 pt-2 md:hidden" aria-label="Public mobile navigation">
          {PUBLIC_NAV.map(({ id, label }) => (
            <button key={id} onClick={() => go(id)}
              className={cx('block w-full rounded-md px-3 py-2 text-left text-sm font-semibold',
                route === id ? 'bg-navy-50 text-navy-900' : 'text-slate-600 hover:bg-slate-50')}>
              {label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

export function PublicFooter({ onNavigate }) {
  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4 lg:px-6">
        <div className="md:col-span-2">
          <PublicBrand dark />
          <p className="mt-4 max-w-md text-xs leading-relaxed text-slate-400">
            AegisBorder AI is an independent operational software platform built for border, identity
            and document screening teams. It is not affiliated with, endorsed by, or part of any
            government, ministry or statutory body.
          </p>
        </div>
        <nav aria-label="Public site">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Navigation</h3>
          <ul className="space-y-2 text-sm">
            {PUBLIC_NAV.map(({ id, label }) => (
              <li key={id}>
                <button onClick={() => onNavigate(id)} className="transition-colors hover:text-white">{label}</button>
              </li>
            ))}
            <li>
              <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-1 font-semibold text-navy-200 transition-colors hover:text-white">
                Secure Portal <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </nav>
        <div>
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">System</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-navy-400" aria-hidden="true" /> Operational portal
            </li>
            <li>On-device screening engines</li>
            <li>Session-local records</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-[11px] text-slate-500 lg:px-6">
          © {new Date().getFullYear()} AegisBorder AI · Demonstration platform — not a government service.
        </div>
      </div>
    </footer>
  );
}

export function PageHeading({ eyebrow, title, sub }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 lg:px-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-navy-600">{eyebrow}</p>
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-navy-900 sm:text-4xl">{title}</h1>
      {sub && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">{sub}</p>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, center }) {
  return (
    <div className={cx('mb-8', center && 'text-center')}>
      {eyebrow && <p className={cx('mb-1 text-xs font-bold uppercase tracking-widest text-navy-600', center && 'justify-center')}>{eyebrow}</p>}
      <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[26px]">{title}</h2>
    </div>
  );
}