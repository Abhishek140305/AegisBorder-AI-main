import { ArrowRight, Loader2 } from 'lucide-react';
import { Badge, cx, accent as accentOf } from '../ui';

export default function OperationCard({ icon, title, description, inputs, badge, onClick, disabled, busy, accent = 'identity' }) {
  const ac = accentOf(accent);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      className={cx(
        'group relative flex flex-col items-start gap-3 rounded-md border border-slate-200 bg-white p-4 text-left transition-all',
        'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700',
        disabled && 'cursor-not-allowed opacity-60 hover:translate-y-0 hover:border-slate-200 hover:shadow-sm'
      )}
    >
      {busy && (
        <span className="absolute right-3 top-3" aria-hidden="true">
          <Loader2 className="h-4 w-4 animate-spin text-navy-700" />
        </span>
      )}
      <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-md border', ac.soft, ac.text, ac.border)} aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {badge && <Badge color="slate" className="!px-1.5 !text-[10px]">{badge}</Badge>}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
        {inputs && (
          <p className="mt-2 text-[11px] font-mono text-slate-400" aria-label="Supported inputs">{inputs}</p>
        )}
      </div>
      <span
        className={cx('absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-slate-300 transition-colors group-hover:bg-navy-800 group-hover:text-white', ac.text)}
        aria-hidden="true"
      >
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}