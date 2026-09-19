import { Compass, Layers, Eye, Info } from 'lucide-react';
import { accent } from '../../components/ui';
import { PageHeading, SectionTitle } from '../../components/PublicSite';
import { VERIFICATIONS } from './verifications';

const ECOSYSTEM = VERIFICATIONS.map(({ icon, accent: a, label }) => ({ icon, accent: a, label }));

const WORKFLOW = [
  { step: 'Capture', detail: 'Document scan, MRZ string or live identity capture.' },
  { step: 'Screen', detail: 'Modules run MRZ, forensics, biometric and threat checks.' },
  { step: 'Assess', detail: 'Signals combine into a composite risk score and tier.' },
  { step: 'Decide', detail: 'Officer reviews and records the final decision.' },
  { step: 'Audit', detail: 'A signed certificate documents the outcome.' },
];

export default function About({ onNavigate }) {
  return (
    <div>
      <PageHeading
        eyebrow="About"
        title="About AegisBorder AI"
        sub="Building a more structured approach to digital identity and document screening."
      />

      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-16 lg:px-6">
        <section>
          <SectionTitle eyebrow="Mission" title="Why AegisBorder AI exists" />
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-slate-600">
            <p>
              Border and identity checks are getting harder, not easier. Documents are more
              sophisticated to forge, identity fraud is more coordinated, and desk officers are
              expected to make defensible decisions under time pressure with a single glance at a
              screen.
            </p>
            <p>
              AegisBorder AI consolidates document and identity verification
              and AI pattern analysis into one screening workflow — so an officer sees a clear,
              structured result instead of a pile of separate tools.
            </p>
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="Our approach" title="Multiple layers, not a single signal" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Layers className="h-5 w-5 text-navy-700" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-extrabold text-navy-900">Defense in depth</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                No single check decides a case. MRZ checks, forensics, identity match
                and AI pattern analysis signals are assessed as a whole.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Compass className="h-5 w-5 text-navy-700" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-extrabold text-navy-900">Explainable outcomes</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Every result shows which checks passed, which flagged, and the evidence behind the
                recommendation — never a bare score.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Eye className="h-5 w-5 text-navy-700" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-extrabold text-navy-900">Operational clarity</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Dense, structured screens designed for officers who need results, history and
                audit trails without hunting for them.
              </p>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="Screening ecosystem" title="The layers of the platform" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ECOSYSTEM.map(({ icon: Icon, accent: a, label }) => {
              const ac = accent(a);
              return (
                <div key={label} className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-md ${ac.soft} ${ac.text}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700">{label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="Workflow" title="How information moves through the system" />
          <ol className="relative space-y-6 border-l border-slate-200 pl-6">
            {WORKFLOW.map(({ step, detail }, i) => (
              <li key={step} className="relative">
                <span className="absolute -left-[2.05rem] flex h-7 w-7 items-center justify-center rounded-full border border-navy-200 bg-white text-[11px] font-extrabold text-navy-800">
                  {i + 1}
                </span>
                <h3 className="text-sm font-extrabold text-navy-900">{step}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionTitle eyebrow="Designed for operational clarity" title="An interface built around decisions" />
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            AegisBorder AI is designed for users who need clear screening results and actionable
            information: officers who must decide, reviewers who must investigate, and
            administrators who must trust that every action is recorded. The public website
            explains the platform; the secure portal is where the work happens.
          </p>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3 text-xs leading-relaxed text-slate-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
              <p>
                <strong className="text-navy-900">Independence notice:</strong> AegisBorder AI is an
                independent operational software platform. It is not affiliated with, endorsed by,
                or part of any government, ministry, law-enforcement agency or statutory body. No
                partnership, certification or deployment claim is made on its behalf.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => onNavigate('features')}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-navy-400 hover:text-navy-900">
            Explore the capabilities
          </button>
          <button onClick={() => onNavigate('contact')}
            className="flex items-center gap-2 rounded-md bg-navy-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-navy-900">
            Contact us
          </button>
        </div>
      </div>
    </div>
  );
}