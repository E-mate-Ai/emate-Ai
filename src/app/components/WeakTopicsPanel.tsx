import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface WeakTopic {
  id: string;
  subject: string;
  unit: string;
  accuracy: number;
  attempts: number;
}

const WEAK_TOPICS: WeakTopic[] = [];

function AccuracyBar({ value }: { value: number }) {
  const color = value < 35 ? 'bg-danger' : value < 50 ? 'bg-warning' : 'bg-success';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="tabular-nums text-xs text-text-muted w-7 text-right">{value}%</span>
    </div>
  );
}

export default function WeakTopicsPanel() {
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={13} className="text-danger" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Weak Topics</h3>
            <p className="text-xs text-text-muted">Below 50% accuracy</p>
          </div>
        </div>
        {WEAK_TOPICS.length > 0 && (
          <button className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors">
            Practice all
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {WEAK_TOPICS.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-3">
            <div className="w-9 h-9 rounded-xl bg-card-hover text-text-muted flex items-center justify-center mb-2">
              <AlertTriangle size={16} strokeWidth={1.75} />
            </div>
            <p className="text-xs font-medium text-text-secondary">No weak topics identified yet</p>
            <p className="text-[11px] text-text-muted mt-0.5">Complete a practice quiz to generate performance diagnostics.</p>
          </div>
        ) : WEAK_TOPICS.map((topic) => (
          <div
            key={topic.id}
            className="p-3 rounded-lg glass-card-hover cursor-pointer transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{topic.unit}</p>
                <p className="text-xs text-text-muted mt-0.5">{topic.subject}</p>
              </div>
              <span className="text-xs text-text-muted shrink-0">{topic.attempts} attempts</span>
            </div>
            <AccuracyBar value={topic.accuracy} />
          </div>
        ))}
      </div>
    </div>
  );
}
