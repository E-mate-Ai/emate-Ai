'use client';

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Zap,
  BookOpen,
  MoreHorizontal,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface QuizSession {
  id: string;
  subject: string;
  unit: string;
  score: number;
  total: number;
  mode: 'sprint' | 'deep-dive';
  timeTaken: string;
  date: string;
  status: 'completed' | 'abandoned';
}

const QUIZ_HISTORY: QuizSession[] = [];

type SortKey = 'date' | 'score' | 'subject' | 'mode';
type SortDir = 'asc' | 'desc';

function ScoreBadge({ score, total }: { score: number; total: number }) {
  const pct = (score / total) * 100;
  const cls = pct >= 70 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-danger';
  return (
    <span className={`tabular-nums font-semibold text-sm ${cls}`}>
      {score}/{total}
    </span>
  );
}

function ModeBadge({ mode }: { mode: 'sprint' | 'deep-dive' }) {
  return mode === 'sprint' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold sprint-badge">
      <Zap size={10} />
      Sprint
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold deep-dive-badge">
      <BookOpen size={10} />
      Deep Dive
    </span>
  );
}

export default function QuizHistoryTable() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = QUIZ_HISTORY.filter(
    (q) =>
      q.subject.toLowerCase().includes(search.toLowerCase()) ||
      q.unit.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    let comparison = 0;
    if (sortKey === 'score') comparison = a.score / a.total - b.score / b.total;
    else if (sortKey === 'subject') comparison = a.subject.localeCompare(b.subject);
    else if (sortKey === 'mode') comparison = a.mode.localeCompare(b.mode);
    else comparison = a.date.localeCompare(b.date);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={12} className="text-text-muted opacity-30" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="text-primary" />
    ) : (
      <ChevronDown size={12} className="text-primary" />
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Quiz History</h2>
          <p className="text-xs text-text-muted mt-0.5">{QUIZ_HISTORY.length} sessions recorded</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search subject or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 text-sm rounded-lg bg-white/5 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-150 w-56"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: 'subject' as SortKey, label: 'Subject' },
                  { key: null, label: 'Unit' },
                  { key: 'score' as SortKey, label: 'Score' },
                  { key: 'mode' as SortKey, label: 'Mode' },
                  { key: null, label: 'Time' },
                  { key: null, label: 'Status' },
                  { key: 'date' as SortKey, label: 'Date' },
                  { key: null, label: '' },
                ].map((col, i) => (
                  <th
                    key={`th-${col.label || i}`}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted ${
                      col.key ? 'cursor-pointer hover:text-text-primary select-none' : ''
                    }`}
                    onClick={() => col.key && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-card-hover text-text-muted flex items-center justify-center mb-1">
                        <BookOpen size={18} strokeWidth={1.75} />
                      </div>
                      <p className="text-sm font-semibold font-display text-text-primary">No quiz sessions found</p>
                      <p className="text-xs text-text-muted">Start a practice quiz in study mode to track your session results.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((session, idx) => (
                  <tr
                    key={session.id}
                    className={`border-b border-border/50 hover:bg-white/[0.02] transition-colors duration-100 group ${
                      idx % 2 === 0 ? '' : 'bg-white/[0.01]'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                      {session.subject}
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[220px] truncate">
                      {session.unit}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={session.score} total={session.total} />
                    </td>
                    <td className="px-4 py-3">
                      <ModeBadge mode={session.mode} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-text-secondary">
                      {session.timeTaken}
                    </td>
                    <td className="px-4 py-3">
                      {session.status === 'completed' ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: 'rgba(34,197,94,0.1)',
                            color: 'var(--success)',
                            border: '1px solid rgba(34,197,94,0.2)',
                          }}
                        >
                          Completed
                        </span>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: 'rgba(245,158,11,0.1)',
                            color: 'var(--warning)',
                            border: '1px solid rgba(245,158,11,0.2)',
                          }}
                        >
                          Abandoned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">{session.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          title="Review session"
                          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/5 transition-all duration-150"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          title="Retry this quiz"
                          className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-all duration-150"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <div className="relative">
                          <button
                            title="More actions"
                            onClick={() => setOpenMenu(openMenu === session.id ? null : session.id)}
                            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/5 transition-all duration-150"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {openMenu === session.id && (
                            <div className="absolute right-0 top-8 z-20 w-36 glass-card shadow-card py-1 fade-in-up">
                              <button className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
                                View in Topper
                              </button>
                              <button className="w-full px-3 py-2 text-left text-xs text-danger hover:bg-danger/10 transition-colors">
                                Delete session
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-text-muted">
            Showing {filtered.length} of {QUIZ_HISTORY.length} sessions
          </p>
          <div className="flex items-center gap-1">
            {['1', '2', '3'].map((pg) => (
              <button
                key={`page-${pg}`}
                className={`w-7 h-7 rounded-md text-xs font-medium transition-all duration-150 ${
                  pg === '1'
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {pg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
