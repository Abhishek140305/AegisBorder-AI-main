import { useMemo, useState } from 'react';
import {
  Search, History as HistoryIcon, Trash2, FileText, FileDown, Clock, SortAsc, SortDesc,
  ShieldCheck, ScanLine, Flag, KeyRound, UserCheck, FileCheck2
} from 'lucide-react';
import {
  Badge, Button, EmptyState, cx, IconButton, Modal, PageHeader, Pagination, downloadCSV, tierSeverityColor
} from '../components/ui';
import { getHistory, deleteRecord, formatTime, secondsAgo, tierMeta, OPERATION_LABELS, useStore } from '../lib/store';
import AuditReport from '../components/AuditReport';
import ThreatReport from '../components/operations/ThreatReport';
import { useT } from '../i18n';

const PAGE_SIZE = 10;

const COLUMNS = [
  { key: 'id', label: 'case' },
  { key: 'person', label: 'person' },
  { key: 'documentNumber', label: 'document' },
  { key: 'riskScore', label: 'risk' },
  { key: 'decision', label: 'decision' },
  { key: 'source', label: 'source' },
  { key: 'ts', label: 'time' },
];

const ICONS = {
  id: KeyRound, person: UserCheck, documentNumber: FileText, riskScore: Flag,
  decision: ShieldCheck, source: ScanLine, ts: Clock,
};

function sortRows(rows, key, dir) {
  const list = [...rows];
  const a = dir === 'asc' ? 1 : -1;
  list.sort((x, y) => {
    const vx = x[key] ?? '';
    const vy = y[key] ?? '';
    if (typeof vx === 'number' && typeof vy === 'number') return (vx - vy) * a;
    return String(vx).localeCompare(String(vy)) * a;
  });
  return list;
}

function ScreeningType({ r }) {
  return r.operationType ? (OPERATION_LABELS[r.operationType] || r.operationType) : 'Document & Identity Screening';
}

export default function History() {
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sort, setSort] = useState({ key: 'ts', dir: 'desc' });
  const [page, setPage] = useState(0);

  const all = useStore(getHistory);

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (filter === 'verified' && tierMeta(r.riskTier).order !== 0) return false;
      if (filter === 'review' && tierMeta(r.riskTier).order !== 1) return false;
      if (filter === 'flagged' && tierMeta(r.riskTier).order < 2 && !r.watchlistFlagged) return false;
      const q = query.trim().toLowerCase();
      if (q && ![r.person, r.documentNumber, r.nationality, r.id].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [all, filter, query]);

  const rows = useMemo(() => sortRows(filtered, sort.key, sort.dir), [filtered, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const view = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const setSortKey = (key) => {
    setPage(0);
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  const exportCsv = () => {
    downloadCSV(`aegisborder_history_${Date.now()}.csv`, t('history_csv_head').split('|'), filtered.map((r) => [
      r.id, r.person, r.documentNumber, r.documentType, r.nationality, r.riskTier,
      r.riskScore, r.decision, r.source, r.watchlistFlagged ? 'YES' : 'NO', formatTime(r.ts),
    ]), { filename: `aegisborder_history.csv` });
  };

  return (
    <div className="workspace">
      <div className="flex w-full flex-col gap-5">
        <PageHeader
          title={t('screening_history')}
          subtitle={t('history_records_note', { count: all.length })}
          accent="identity"
          icon={HistoryIcon}
          actions={
            <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
              <FileDown className="h-4 w-4" /> {t('export_csv')}
            </Button>
          }
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: t('filter_all') },
              { id: 'verified', label: t('filter_verified') },
              { id: 'review', label: t('filter_review') },
              { id: 'flagged', label: t('filter_flagged') },
            ].map((f) => (
              <button key={f.id} onClick={() => { setFilter(f.id); setPage(0); }}
                className={cx('rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                  filter === f.id ? 'bg-navy-800 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50')}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t('search_placeholder')}
              aria-label={t('search_placeholder')}
              className="ctl-input rounded-md bg-white pl-9" />
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<HistoryIcon className="h-8 w-8 text-slate-300" />} title={all.length === 0 ? t('no_screenings_recorded') : t('no_results_match')}
            hint={all.length === 0 ? t('no_screenings_recorded_hint') : t('no_results_match_hint')} />
        ) : (
          <>
            <div className="hidden lg:block">
              <div className="tbl-wrap max-h-[70vh] overflow-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      {COLUMNS.map(({ key, label }) => {
                        const Icon = ICONS[key];
                        const active = sort.key === key;
                        return (
                          <th key={key}>
                            <button onClick={() => setSortKey(key)} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                              {t(label)}
                              {active && (sort.dir === 'asc'
                                ? <SortAsc className="h-3 w-3 text-navy-700" aria-hidden="true" />
                                : <SortDesc className="h-3 w-3 text-navy-700" aria-hidden="true" />)}
                            </button>
                          </th>
                        );
                      })}
                      <th className="text-right">{t('action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.map((r) => {
                      return (
                        <tr key={r.id}>
                          <td className="font-mono text-xs text-navy-700">{r.id}</td>
                          <td>
                            <div className="font-semibold text-slate-900">{r.person}</div>
                            <div className="text-xs text-slate-400">{secondsAgo(r.ts)}</div>
                          </td>
                          <td>
                            <div className="font-mono text-xs text-slate-600">{r.documentNumber}</div>
                            <div className="text-xs text-slate-400">{r.documentType} · {r.nationality || '—'}</div>
                          </td>
                          <td>
                            <Badge color={tierSeverityColor(r.riskTier)}>{t('tier_' + r.riskTier)}</Badge>
                            <span className="ml-1.5 text-xs font-semibold tabular-nums text-slate-400">{r.riskScore}%</span>
                          </td>
                          <td className="text-xs text-slate-500">{r.decision}</td>
                          <td>{r.source === 'scenario' ? <Badge color="amber">{t('demo')}</Badge> : <Badge color="blue">{t('live')}</Badge>}</td>
                          <td className="text-xs tabular-nums text-slate-400">{formatTime(r.ts)}</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => setSelected(r)}>
                                <FileText className="h-3.5 w-3.5" /> {t('view')}
                              </Button>
                              <IconButton label={t('delete_record')} onClick={() => setConfirmDelete(r)}>
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination page={safePage} pages={pages} total={rows.length} onChange={setPage} prevLabel={t('prev_pg')} nextLabel={t('next_pg')} />
              </div>
            </div>

            <div className="space-y-2 lg:hidden">
              {view.map((r) => {
                return (
                  <div key={r.id} className="rounded-md border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <button className="min-w-0 text-left" onClick={() => setSelected(r)}>
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <span className="truncate">{r.person}</span>
                          <Badge color={tierSeverityColor(r.riskTier)}>{t('tier_' + r.riskTier)}</Badge>
                        </div>
                        <div className="mt-0.5 font-mono text-xs text-slate-400">{r.documentNumber} · {secondsAgo(r.ts)}</div>
                      </button>
                      <Badge color={r.source === 'scenario' ? 'amber' : 'blue'}>{r.source === 'scenario' ? t('demo') : t('live')}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                      <div className="text-xs text-slate-500">{r.decision} · <span className="font-bold">{r.riskScore}%</span></div>
                      <div className="flex items-center gap-1">
                        <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => setSelected(r)}>{t('view_report')}</Button>
                        <IconButton label={t('delete_record')} onClick={() => setConfirmDelete(r)}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Pagination page={safePage} pages={pages} total={rows.length} onChange={setPage} prevLabel={t('prev_pg')} nextLabel={t('next_pg')} />
            </div>
          </>
        )}
      </div>

      {selected && (
        <CaseDetail
          record={selected}
          t={t}
          onClose={() => setSelected(null)}
          onConfirmDelete={() => setConfirmDelete(selected)}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={t('delete_record')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>{t('cancel')}</Button>
            <Button variant="danger" onClick={() => {
              deleteRecord(confirmDelete.id);
              if (selected?.id === confirmDelete.id) setSelected(null);
              setConfirmDelete(null);
            }}><Trash2 className="h-4 w-4" /> {t('delete')}</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {t('delete_confirm', { id: confirmDelete?.id })}
        </p>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------
   Case investigation view — structured scan + activity timeline
   ------------------------------------------------------------ */
function CaseDetail({ record: r, t, onClose, onConfirmDelete }) {
  const [showFull, setShowFull] = useState(false);

  const timeline = useMemo(() => {
    const items = [
      { label: t('tl_case_created'), detail: formatTime(r.ts), tone: 'slate' },
    ];
    if (r.operationType) {
      items.push({ label: t('tl_analysis_completed'), detail: r.classification || r.decision, tone: 'blue' });
      items.push({ label: t('tl_decision_recorded'), detail: r.decision, tone: tierSeverityColor(r.riskTier) });
      if (r.watchlistFlagged) items.push({ label: t('tl_flag_raised'), detail: t('tl_watchlist_high'), tone: 'red' });
    } else {
      items.push({ label: t('tl_document_processed'), detail: `${r.documentType} · ${r.documentNumber}`, tone: 'blue' });
      items.push({
        label: t('tl_validation_completed'),
        detail: r.summary ? `OCR/MRZ · ${t('chk_doc_valid')} ${r.summary.validationValid ? t('tl_valid') : t('tl_invalid')}` : '—',
        tone: r.summary?.validationValid ? 'green' : 'amber',
      });
      if (r.summary?.faceMatched != null) {
        items.push({
          label: t('tl_face_compared'),
          detail: `${t('match')} ${r.summary.faceScore ?? '—'}%`,
          tone: r.summary.faceMatched ? 'green' : 'orange',
        });
      }
      items.push({
        label: t('tl_watchlist_check'),
        detail: r.watchlistFlagged ? t('tl_watchlist_match') : t('no_watchlist_match'),
        tone: r.watchlistFlagged ? 'red' : 'green',
      });
    }
    if (r.officerStatus) {
      items.push({
        label: t('tl_officer_action'),
        detail: r.officerStatus === 'approved' ? t('verified') : r.officerStatus,
        tone: 'green',
      });
    }
    return items;
  }, [r, t]);

  const factors = r.full?.risk_assessment?.risk_factors?.map((f) => f.description) || r.factors || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={t('case_details')}>
      <div className="mx-auto flex min-h-full max-w-5xl flex-col">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-navy-900 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-navy-300" />
            <span className="text-sm font-bold">{t('case_details')} · {r.id}</span>
            <Badge color={tierSeverityColor(r.riskTier)}>{t('tier_' + r.riskTier)}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setShowFull(true)}>
              <FileText className="h-3.5 w-3.5" /> {t('open_full_report')}
            </Button>
            <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={onConfirmDelete}>
              <Trash2 className="h-3.5 w-3.5" /> {t('delete_record')}
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-navy-800">{t('close')}</Button>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
          <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 md:grid-cols-4">
            <Meta k={t('status')} v={<ReviewStatusLabel r={r} t={t} />} />
            <Meta k={t('risk_level')} v={<><span className="font-bold">{r.riskScore}%</span> {t('tier_' + r.riskTier)}</>} />
            <Meta k={t('tl_created')} v={formatTime(r.ts)} />
            <Meta k={t('tl_last_update')} v={r.officerStatus || formatTime(r.ts)} />
          </div>

          <div className="grid gap-6 pt-5 lg:grid-cols-3">
            <section aria-label={t('case_information')}>
              <PanelHeading icon={KeyRound} text={t('case_information')} />
              <div className="mt-2 divide-y divide-slate-100">
                <InfoRow label={t('case')} value={r.id} mono />
                <InfoRow label={t('document')} value={r.documentType} />
                <InfoRow label={t('source')} value={r.source === 'scenario' ? t('demo') : t('live')} />
                <InfoRow label={t('watchlist')} value={r.watchlistFlagged ? t('tl_flag_raised') : t('no_watchlist_match')} />
                <InfoRow label={t('tl_officer_action')} value={r.officerStatus || '—'} />
              </div>
            </section>

            <section aria-label={t('subject_document')}>
              <PanelHeading icon={FileCheck2} text={t('subject_document')} />
              <div className="mt-2 divide-y divide-slate-100">
                <InfoRow label={t('person')} value={r.person} />
                <InfoRow label={t('doc_no')} value={r.documentNumber} mono />
                <InfoRow label={t('nationality')} value={r.nationality || '—'} />
                <InfoRow label={t('screening_type')} value={<ScreeningType r={r} />} />
                <InfoRow label={t('decision')} value={r.decision} />
              </div>
            </section>

            <section aria-label={t('risk_analysis')}>
              <PanelHeading icon={Flag} text={t('risk_analysis')} />
              <div className="mt-2 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{t('risk_score')}</span><span className="tabular-nums">{r.riskScore}/100</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div className={cx('h-full rounded-full', tierColorBar(r.riskTier))} style={{ width: `${Math.max(2, r.riskScore)}%` }} />
                  </div>
                </div>
                {r.confidence != null && <InfoRow label={t('confidence_label')} value={`${r.confidence}%`} />}
                {factors.length === 0 ? (
                  <p className="text-xs text-slate-400">{t('no_indicators')}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {factors.slice(0, 6).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" aria-hidden="true" />{f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <PanelHeading icon={Clock} text={t('activity_timeline')} />
            <ol className="mt-3 space-y-0">
              {timeline.map((x, i) => (
                <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="flex flex-col items-center" aria-hidden="true">
                    <span className={cx('mt-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ring-1', dotColor(x.tone))} />
                    {i < timeline.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
                  </span>
                  <div className="min-w-0 pb-1">
                    <p className="text-sm font-semibold text-slate-800">{x.label}</p>
                    <p className="text-xs text-slate-500">{x.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {showFull && (r.operationType
        ? <ThreatReport record={r} onClose={() => setShowFull(false)} />
        : r.full && <AuditReport screening={r.full} onClose={() => setShowFull(false)} />)}
    </div>
  );
}

function ReviewStatusLabel({ r, t }) {
  if (r.watchlistFlagged) return <Badge color="red"><Flag className="h-3 w-3" /> {t('watchlist')}</Badge>;
  const meta = tierMeta(r.riskTier);
  const label = meta.order === 0 ? t('verified') : meta.order === 1 ? t('review_required') : t('investigation');
  return <Badge color={meta.color}>{label}</Badge>;
}

function tierColorBar(tier) {
  const map = { LOW: 'bg-emerald-500', MODERATE: 'bg-amber-500', HIGH: 'bg-orange-500', CRITICAL: 'bg-red-600' };
  return map[tier] || 'bg-slate-400';
}

function dotColor(tone) {
  const map = { green: 'bg-emerald-500', amber: 'bg-amber-500', orange: 'bg-orange-500', red: 'bg-red-500', blue: 'bg-blue-600', slate: 'bg-slate-400' };
  return map[tone] || map.slate;
}

function PanelHeading({ icon: Icon, text }) {
  return (
    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-900">
      <Icon className="h-3.5 w-3.5 text-navy-700" aria-hidden="true" /> {text}
    </h4>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <span className={cx('text-right text-xs font-semibold text-slate-900', mono && 'font-mono text-[11px]')}>{value || '—'}</span>
    </div>
  );
}

function Meta({ k, v }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{v}</div>
    </div>
  );
}