import { ArrowRight, ArrowUpRight, CheckCircle2, ScanLine, Landmark } from 'lucide-react';
import { accent, cx } from '../../components/ui';
import { VERIFICATIONS } from './verifications';

export default function VerificationLanding({ kind, onNavigate }) {
  const v = VERIFICATIONS.find((x) => x.kind === kind) || VERIFICATIONS[0];
  const ac = accent(v.accent);
  const Icon = v.icon;
  const others = VERIFICATIONS.filter((x) => x.kind !== v.kind);

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-6 lg:py-20">
          <div>
            <p className={cx('mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest', ac.soft, ac.text, 'border-current/20')}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {v.eyebrow}
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-navy-900 sm:text-5xl">{v.title}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">{v.tagline}</p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500">{v.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onNavigate('screening')}
                className="flex items-center gap-2 rounded-md bg-navy-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-navy-900">
                Open {v.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button onClick={() => onNavigate('features')}
                className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-navy-400 hover:text-navy-900">
                Explore all capabilities
              </button>
            </div>
          </div>

          <div className={cx('rounded-lg border bg-white p-5 shadow-sm', ac.border)} aria-label={`${v.label} highlights`}>
            <div className={cx('mb-3 flex items-center justify-between border-b px-1 pb-2', ac.soft)}>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Module preview</span>
              <span className={cx('flex items-center gap-1 text-[11px] font-bold', ac.text)}>
                <ScanLine className="h-3.5 w-3.5" aria-hidden="true" /> Live module
              </span>
            </div>
            <div className="rounded-md border border-slate-100 bg-white">
              {v.preview.map(({ label, value, tone }) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0">
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                  <span className={cx('text-xs font-bold', tone)}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IT INCLUDES */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <p className={cx('mb-1 text-xs font-bold uppercase tracking-widest', ac.text)}>What it includes</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[26px]">Capabilities in {v.label}.</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {v.checks.map((c) => (
            <div key={c} className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              <CheckCircle2 className={cx('mt-0.5 h-4 w-4 shrink-0', ac.icon)} aria-hidden="true" />
              <span>{c}</span>
            </div>
          ))}
        </div>
      </section>

      {/* OTHER VERIFICATIONS */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Landmark className="h-4 w-4" aria-hidden="true" /> Other verification areas
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {others.map((o) => {
              const oac = accent(o.accent);
              const OIcon = o.icon;
              return (
                <button key={o.kind} onClick={() => onNavigate(o.kind)}
                  className="group flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md">
                  <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', oac.soft, oac.text)}>
                    <OIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold text-navy-900">{o.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">{o.blurb}</span>
                  </span>
                  <ArrowUpRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-navy-800" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}