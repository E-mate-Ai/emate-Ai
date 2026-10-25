'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import {
  isSkillPermitted,
  skillPermissionStorageKey,
  type SkillDescription,
  type SkillPermissionPreferences,
} from '@/lib/agent-skills/core';

export default function AgentSkillsSettingsPanel({ userId }: { userId?: string | null }) {
  const [skills, setSkills] = useState<SkillDescription[]>([]);
  const [permissions, setPermissions] = useState<SkillPermissionPreferences>({});
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/skills')
      .then(async (response) => {
        if (!response.ok) throw new Error('Skill catalog unavailable');
        return response.json();
      })
      .then((payload: { skills?: SkillDescription[] }) => {
        if (cancelled) return;
        setSkills(Array.isArray(payload.skills) ? payload.skills : []);
        setUnavailable(false);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(skillPermissionStorageKey(userId));
      setPermissions(saved ? JSON.parse(saved) : {});
    } catch {
      setPermissions({});
    }
  }, [userId]);

  const toggleSkill = (skill: SkillDescription) => {
    const next = { ...permissions, [skill.id]: !isSkillPermitted(skill, permissions) };
    setPermissions(next);
    try {
      localStorage.setItem(skillPermissionStorageKey(userId), JSON.stringify(next));
    } catch {
      // Skill permissions are enforced locally and validated again by the server.
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-zinc-500 dark:text-[#b3b3b3]">
        Choose which capabilities e-Mate can use when they fit your request. Skills only provide guidance; available tools run through validated server integrations.
      </p>

      {loading ? (
        <div className="rounded-[22px] border border-zinc-200 bg-white p-5 text-sm text-zinc-500 dark:border-[#4b4b4b] dark:bg-[#404040] dark:text-zinc-300">
          Loading capabilities…
        </div>
      ) : unavailable ? (
        <div role="status" className="rounded-[22px] border border-zinc-200 bg-white p-5 text-sm text-zinc-500 dark:border-[#4b4b4b] dark:bg-[#404040] dark:text-zinc-300">
          Capabilities are temporarily unavailable. Please reopen Settings to try again.
        </div>
      ) : (
        <div className="space-y-3">
          {skills.map((skill) => {
            const enabled = isSkillPermitted(skill, permissions);
            return (
              <section key={skill.id} className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#4b4b4b] dark:bg-[#404040] dark:shadow-none">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                      <SparklesIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{skill.name}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-[#b3b3b3]">{skill.description}</p>
                      <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">License: {skill.license}</p>
                    </div>
                  </div>
                  {skill.status === 'enabled' ? (
                    <button
                      type="button"
                      aria-pressed={enabled}
                      onClick={() => toggleSkill(skill)}
                      className={enabled
                        ? 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
                        : 'inline-flex h-9 shrink-0 items-center rounded-full border border-zinc-200 bg-zinc-100 px-4 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-[#555] dark:bg-[#414141] dark:text-zinc-300 dark:hover:bg-[#505050]'}
                    >
                      {enabled && <CheckIcon className="h-4 w-4" aria-hidden="true" />}
                      {enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-500 dark:bg-[#414141] dark:text-zinc-400">Coming soon</span>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-relaxed text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        You can change these choices anytime. External actions require their own permission and confirmation.
      </p>
    </div>
  );
}
