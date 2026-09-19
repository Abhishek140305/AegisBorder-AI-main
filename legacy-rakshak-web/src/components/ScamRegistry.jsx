import React, { useState, useMemo } from 'react';
import { Database, Search, ChevronRight, Shield, ExternalLink } from 'lucide-react';

/* Realistic demo entries */
const REGISTRY = [
  { threat: 'electricity-nodal-officer.in',  type: 'WEBSITE', risk: 'CRITICAL', reports: 1284, status: 'BLOCKED' },
  { threat: 'sbi-bank-kyc-update.top',       type: 'WEBSITE', risk: 'CRITICAL', reports: 932,  status: 'BLOCKED' },
  { threat: 'cashback-claim@ybl',            type: 'UPI',     risk: 'CRITICAL', reports: 1820, status: 'BLOCKED' },
  { threat: '+91 98765 43210',               type: 'PHONE',   risk: 'HIGH',     reports: 415,  status: 'FLAGGED' },
  { threat: 'AnyDesk_Support.apk',            type: 'APP',     risk: 'CRITICAL', reports: 706,  status: 'BLOCKED' },
  { threat: 'free-recharge-jio-5g.live',      type: 'WEBSITE', risk: 'HIGH',     reports: 318,  status: 'BLOCKED' },
  { threat: 'parcel-customs-duty.in',         type: 'WEBSITE', risk: 'HIGH',     reports: 271,  status: 'FLAGGED' },
  { threat: 'Dear Customer aapka bill...',    type: 'SMS',     risk: 'HIGH',     reports: 894,  status: 'FLAGGED' },
  { threat: 'job-offer-interview-fee.in',     type: 'WEBSITE', risk: 'MEDIUM',   reports: 152,  status: 'FLAGGED' },
  { threat: 'kyc-update@ybl',                type: 'UPI',     risk: 'CRITICAL', reports: 1043, status: 'BLOCKED' },
];

const FILTERS = ['All', 'SMS', 'WhatsApp', 'Website', 'UPI', 'Phone', 'App'];

const riskClass = (r) => {
  if (r === 'CRITICAL' || r === 'HIGH') return 'badge-danger';
  if (r === 'MEDIUM') return 'badge-warning';
  return 'badge-success';
};

const statusClass = (s) => {
  if (s === 'BLOCKED') return 'badge-danger';
  if (s === 'FLAGGED') return 'badge-warning';
  return 'badge-success';
};

export default function ScamRegistry() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return REGISTRY.filter(r => {
      if (filter !== 'All' && r.type !== filter.toUpperCase() && !(filter === 'WhatsApp' && r.type === 'SMS')) return false;
      if (!q) return true;
      return r.threat.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    });
  }, [query, filter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="panel-elevated p-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center">
            <Database className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Verified Scam Registry</h2>
            <p className="text-[12.5px] text-[var(--text-muted)]">Search numbers, URLs, VPAs and apps reported to the community.</p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 h-10">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phone number, URL, VPA or scam…"
              className="bg-transparent border-none text-[13.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip ${filter === f ? 'chip-active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      <section className="panel-elevated overflow-hidden">
        <div className="table-row header">
          <div>Threat</div>
          <div>Type</div>
          <div>Risk</div>
          <div>Reports</div>
          <div>Status</div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-[var(--text-muted)]">No results.</div>
        ) : (
          filtered.map((r, i) => (
            <div key={i} className="table-row">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate font-mono">{r.threat}</p>
              </div>
              <div><span className="badge badge-neutral">{r.type}</span></div>
              <div><span className={`badge ${riskClass(r.risk)}`}>{r.risk}</span></div>
              <div className="text-[12.5px] text-[var(--text-secondary)] tabular-nums">{r.reports.toLocaleString()}</div>
              <div><span className={`badge ${statusClass(r.status)}`}>{r.status}</span></div>
            </div>
          ))
        )}
      </section>

      <p className="text-[11px] text-[var(--text-muted)] px-1">
        Demo data for the Smart India Hackathon evaluation. Counts shown here do not represent real reported figures.
      </p>
    </div>
  );
}
