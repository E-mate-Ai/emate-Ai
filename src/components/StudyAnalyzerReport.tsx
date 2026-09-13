'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Target, BookOpen, ArrowRight, TrendingDown } from 'lucide-react';
import type { StudyAnalyzerReport as ReportType, MCQSubmission } from '@/lib/agents/types';
import { cn } from '@/lib/utils';

interface StudyAnalyzerReportProps {
  report: ReportType;
  onReinforce: (weakTopics: string[], submissionData?: MCQSubmission) => void;
}

export default function StudyAnalyzerReport({ report, onReinforce }: StudyAnalyzerReportProps) {
  // Server-safe default: start with light mode; sync from localStorage after hydration
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(localStorage.getItem('nk-theme') !== 'light');
    const onStorage = () => setIsDark(localStorage.getItem('nk-theme') !== 'light');
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const scoreBg =
    report.overallScore >= 70
      ? 'bg-emerald-500/10 border-emerald-500/20'
      : report.overallScore >= 40
        ? 'bg-amber-500/10 border-amber-500/20'
        : 'bg-red-500/10 border-red-500/20';

  const barColor = (accuracy: number) =>
    accuracy >= 0.7 ? 'bg-emerald-500' : accuracy >= 0.4 ? 'bg-amber-500' : 'bg-red-500';

  const weakTopics = report.weakAreas.map((w) => w.topicTag);

  return (
    <div
      className={cn(
        'my-3 rounded-2xl border p-5 max-w-lg',
        'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
      )}
    >
      {/* Header + Score */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className={cn(
            'flex items-center justify-center w-14 h-14 rounded-2xl border-2 shrink-0',
            scoreBg
          )}
        >
          <span className={cn('text-xl font-bold', scoreColorClass(report.overallScore))}>
            {report.overallScore}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-amber-500" />
            <h4 className="text-sm font-semibold">Quiz Complete</h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {report.weakAreas.length === 0
              ? 'Perfect score — no weak areas identified!'
              : `${report.weakAreas.length} weak area${report.weakAreas.length > 1 ? 's' : ''} identified for review`}
          </p>
        </div>
      </div>

      {/* Weak Areas */}
      {report.weakAreas.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={13} className="text-red-500" />
            <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Weak Areas</h5>
          </div>
          <div className="space-y-2.5">
            {report.weakAreas.map((area) => (
              <div key={area.topicTag}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {area.topicTag}
                  </span>
                  <span className={cn('text-xs font-mono', scoreColorClass(area.accuracy * 100))}>
                    {Math.round(area.accuracy * 100)}%
                  </span>
                </div>
                <div
                  className={cn(
                    'h-1.5 rounded-full overflow-hidden',
                    isDark ? 'bg-zinc-800' : 'bg-zinc-100'
                  )}
                >
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      barColor(area.accuracy)
                    )}
                    style={{ width: `${area.accuracy * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen size={13} className="text-[#1f51ff]" />
          <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Recommendations
          </h5>
        </div>
        <ul className="space-y-1.5">
          {report.recommendations.map((rec, i) => (
            <li
              key={i}
              className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1 before:h-1 before:rounded-full before:bg-zinc-300 dark:before:bg-zinc-600"
            >
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      {weakTopics.length > 0 && (
        <button
          type="button"
          onClick={() => onReinforce(weakTopics, report.submissionData)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1f51ff] text-white hover:bg-[#1a45e0] transition-colors cursor-pointer outline-none"
        >
          <TrendingDown size={14} />
          Reinforce Weak Concepts with Study Agent
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

// Helpers
function scoreColorClass(score: number): string {
  if (score >= 70) return 'text-emerald-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}
