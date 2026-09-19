import { useMemo, useState } from 'react';
import { CheckCircle2, ScanLine, Search, ArrowUpRight } from 'lucide-react';
import { accent } from '../../components/ui';
import { PageHeading } from '../../components/PublicSite';
import { VERIFICATIONS } from './verifications';

const CATEGORIES = VERIFICATIONS.map((v) => ({ label: v.label, ids: [v.kind] }));

export default function Features({ onNavigate }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return VERIFICATIONS;
    return VERIFICATIONS.filter((v) =>
      [v.title, v.tagline, v.blurb, v.body, ...v.checks].join(' ').toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <PageHeading
        eyebrow="Features"
        title="AegisBorder AI Capabilities"
        sub="Core verification areas — document & identity verification and AI analysis — in one platform."
      />

      <div className="mx-auto max-w-6xl px-4 pb-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <nav className="flex flex-wrap gap-2" aria-label="Feature categories">
            {CATEGORIES.map((c) => (
              <a key={c.label} href={`#${c.ids[0]}`} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:border-navy-300 hover:text-navy-900">
                {c.label}
              </a>
            ))}
          </nav>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search features…"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
              aria-label="Search features" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 lg:px-6">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm font-semibold text-slate-500">No features match "{query}". Try a different term.</p>
        )}
        {filtered.map(({ kind, icon: Icon, accent: a, title, tagline, body, checks, preview }) => {
          const ac = accent(a);
          const last = filtered[filtered.length - 1].kind === kind;
          return (
            <section key={kind} id={kind} className="scroll-mt-20">
              <div className={`grid gap-6 lg:grid-cols-2 lg:items-start ${last ? '' : 'pb-14'}`}>
                <div className="lg:border-r lg:border-slate-200 lg:pr-8">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-md ${ac.soft} ${ac.text}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-navy-900">{title}</h2>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{tagline}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{body}</p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {checks.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${ac.icon}`} aria-hidden="true" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => onNavigate(kind)}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-navy-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-navy-900">
                    Open {title} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className={`rounded-lg border ${ac.border} bg-white shadow-sm`}>
                  <div className={`flex items-center justify-between border-b ${ac.soft} px-4 py-2`}>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Module preview</span>
                    <span className={`flex items-center gap-1 text-[11px] font-bold ${ac.text}`}>
                      <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                      Sample data
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="rounded-md border border-slate-100 bg-white">
                      {preview.map(({ label, value, tone }) => (
                        <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0">
                          <span className="text-xs font-semibold text-slate-500">{label}</span>
                          <span className={`text-xs font-bold ${tone}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}