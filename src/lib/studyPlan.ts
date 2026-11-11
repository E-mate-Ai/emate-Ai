/**
 * Centralized Study Plan storage, sync, and context generation.
 * Keeps Study Mode in sync with the student's active exam timeline & study plan,
 * while leaving General Mode completely untouched.
 */

import type { StructuredPlan } from './studyPlannerService';
export type {
  StructuredPlan,
  StudyTask,
  DaySchedule,
  SubjectStrategy,
  RevisionMilestone,
} from './studyPlannerService';

export interface StudyPlanFormData {
  examName: string;
  examDate: string;
  subjects: string[];
  dailyHours: number;
  prepLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string;
}

export interface SubjectProgress {
  [subject: string]: number; // 0–100
}

export interface StudyPlan {
  formData: StudyPlanFormData;
  aiResponse: string;
  structured?: StructuredPlan;
  subjectProgress: SubjectProgress;
  completedTaskIds?: string[];
  generatedAt: string;
}

export const STUDY_PLAN_STORAGE_KEY = 'emate-study-plan';
export const STUDY_PLAN_CHANGE_EVENT = 'emate-study-plan-change';

/**
 * Calculate days remaining until target exam date (clamped to >= 0).
 */
export function daysRemaining(examDate: string): number {
  if (!examDate) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(examDate);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Safely retrieve the active study plan from localStorage.
 */
export function getStoredStudyPlan(): StudyPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STUDY_PLAN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudyPlan;
  } catch {
    return null;
  }
}

/**
 * Persist the active study plan and notify other components via window event.
 */
export function saveStoredStudyPlan(plan: StudyPlan): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify(plan));
    window.dispatchEvent(new Event(STUDY_PLAN_CHANGE_EVENT));
  } catch (err) {
    console.error('[studyPlan] Failed to save plan:', err);
  }
}

/**
 * Remove stored study plan and notify listeners.
 */
export function clearStoredStudyPlan(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STUDY_PLAN_STORAGE_KEY);
    window.dispatchEvent(new Event(STUDY_PLAN_CHANGE_EVENT));
  } catch (err) {
    console.error('[studyPlan] Failed to clear plan:', err);
  }
}

/**
 * Build a concise, prompt-ready context string from the active study plan.
 * Used exclusively for Study Mode (omitted in General Mode).
 */
export function buildStudyPlanContext(plan: StudyPlan | null): string {
  if (!plan || !plan.formData) return '';
  const { formData, subjectProgress } = plan;
  const days = daysRemaining(formData.examDate);

  const subjectBreakdown = formData.subjects
    .map((s) => {
      const prog = subjectProgress?.[s] ?? 0;
      return `${s} (${prog}% completed)`;
    })
    .join(', ');

  const lines = [
    `Target Exam: ${formData.examName || 'Upcoming Exam'}`,
    `Exam Date: ${formData.examDate || 'Not specified'} (${days} day${days === 1 ? '' : 's'} remaining)`,
    `Daily Study Allocation: ${formData.dailyHours || 4} hours/day`,
    `Preparation Level: ${formData.prepLevel || 'Intermediate'}`,
    `Active Subjects: ${subjectBreakdown || 'General'}`,
  ];

  if (formData.topics?.trim()) {
    lines.push(`Focus Topics / Syllabus Targets: ${formData.topics.trim().slice(0, 500)}`);
  }

  return lines.join('\n');
}

