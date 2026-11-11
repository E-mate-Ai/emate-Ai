'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DeleteButton from '@/components/ui/DeleteButton';
import {
  Calendar,
  Clock,
  BookOpen,
  Brain,
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronRight,
  BarChart2,
  GraduationCap,
  Zap,
  RotateCcw,
  Copy,
  Check,
  Share2,
  ListTodo,
  CalendarDays,
  Flame,
  Award,
  Layers,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import {
  getStoredStudyPlan,
  saveStoredStudyPlan,
  clearStoredStudyPlan,
  daysRemaining,
  type StudyPlan as PlanState,
  type StudyPlanFormData as FormData,
  type SubjectProgress,
  type StructuredPlan,
  type StudyTask,
} from '@/lib/studyPlan';
import { buildStructuredStudyPlan } from '@/lib/studyPlannerService';
import { addSubject as addNotebookSubject } from '@/lib/notebook';

const DEFAULT_FORM: FormData = {
  examName: '',
  examDate: '',
  subjects: [],
  dailyHours: 4,
  prepLevel: 'Intermediate',
  topics: '',
};

// Preset exam templates for fast 1-click onboarding
const EXAM_PRESETS = [
  {
    name: 'JEE / Engineering',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    hours: 6,
    level: 'Intermediate' as const,
    topics: 'Mechanics, Electrodynamics, Organic Reactions, Calculus, Vectors',
  },
  {
    name: 'NEET / Medical',
    subjects: ['Biology', 'Chemistry', 'Physics'],
    hours: 6,
    level: 'Intermediate' as const,
    topics: 'Human Physiology, Genetics, Chemical Bonding, Optics, Modern Physics',
  },
  {
    name: 'UPSC / Civil Services',
    subjects: ['General Studies', 'Polity', 'History', 'Geography'],
    hours: 7,
    level: 'Advanced' as const,
    topics: 'Indian Constitution, Modern Indian History, Physical Geography, Current Affairs',
  },
  {
    name: 'Semester Finals',
    subjects: ['Core Major 1', 'Core Major 2', 'Elective Subject'],
    hours: 4,
    level: 'Beginner' as const,
    topics: 'Midterm concepts, assignment problems, past semester question papers',
  },
  {
    name: 'Coding & Tech Interview',
    subjects: ['Data Structures', 'Algorithms', 'System Design'],
    hours: 4,
    level: 'Intermediate' as const,
    topics: 'Dynamic Programming, Graphs, Trees, Caching, Database Indexing',
  },
];

const POPULAR_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Economics',
  'English Literature',
];

// ─────────────────────────── Main Client Component ───────────────────────────

export default function StudyPlannerClient() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [subjectInput, setSubjectInput] = useState('');
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'subjects' | 'milestones' | 'tips' | 'notes'>('today');
  const [copied, setCopied] = useState(false);

  // Load active study plan on mount
  useEffect(() => {
    const stored = getStoredStudyPlan();
    if (stored) {
      // Ensure structured object exists even for legacy stored plans
      if (!stored.structured) {
        const fallback = buildStructuredStudyPlan(
          stored.formData,
          daysRemaining(stored.formData.examDate)
        );
        stored.structured = fallback.structured;
      }
      setPlan(stored);
      setForm(stored.formData);
    }
    setHydrated(true);
  }, []);

  const days = useMemo(
    () => daysRemaining(plan ? plan.formData.examDate : form.examDate),
    [plan, form.examDate]
  );

  // ── Form handlers ──

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function applyPreset(preset: typeof EXAM_PRESETS[0]) {
    // Default exam date to 45 days from today if not set
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 45);
    const dateStr = defaultDate.toISOString().split('T')[0];

    setForm({
      examName: preset.name,
      examDate: form.examDate || dateStr,
      subjects: preset.subjects,
      dailyHours: preset.hours,
      prepLevel: preset.level,
      topics: preset.topics,
    });
    toast.success(`Applied ${preset.name} template`);
  }

  function addSubject(subjToAdd?: string) {
    const target = subjToAdd || subjectInput;
    const trimmed = target.trim();
    if (!trimmed) return;
    const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    setForm((prev) => ({
      ...prev,
      subjects: [...new Set([...prev.subjects, ...parts])],
    }));
    if (!subjToAdd) setSubjectInput('');
  }

  function removeSubject(sub: string) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== sub),
    }));
  }

  function handleSubjectKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSubject();
    }
  }

  // ── Generate plan ──

  async function handleGenerate() {
    if (!form.examName.trim()) {
      toast.error('Please enter your exam name.');
      return;
    }
    if (!form.examDate) {
      toast.error('Please select your exam date.');
      return;
    }
    if (form.subjects.length === 0) {
      toast.error('Add at least one subject to your plan.');
      return;
    }

    setLoading(true);
    toast.loading('Crafting your personalized study timetable…', { id: 'plan-gen' });

    try {
      // 1. Try dedicated study planner generator API
      let newPlan: PlanState | null = null;

      try {
        const response = await fetch('/api/study-planner/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.plan) {
            newPlan = data.plan;
          }
        }
      } catch (networkErr) {
        console.warn('API route failed, generating client-side:', networkErr);
      }

      // 2. High-grade guaranteed fallback if network or API didn't respond
      if (!newPlan) {
        const generated = buildStructuredStudyPlan(form, days);
        const initialProgress: SubjectProgress = {};
        form.subjects.forEach((s) => {
          initialProgress[s] = 0;
        });

        newPlan = {
          formData: { ...form },
          aiResponse: generated.markdown,
          structured: generated.structured,
          subjectProgress: initialProgress,
          completedTaskIds: [],
          generatedAt: new Date().toISOString(),
        };
      }

      setPlan(newPlan);
      saveStoredStudyPlan(newPlan);

      // Auto-register plan subjects into Emate notebooks for Study mode
      form.subjects.forEach((subj) => {
        if (subj.trim()) addNotebookSubject(subj.trim());
      });

      toast.success('Study timetable created & synced with Study Mode! 🎉', { id: 'plan-gen' });
    } catch (err) {
      console.error(err);
      toast.error('Could not generate plan. Please verify your inputs.', { id: 'plan-gen' });
    } finally {
      setLoading(false);
    }
  }

  // ── Progress & Task Toggle ──

  function toggleTaskCompletion(taskId: string) {
    if (!plan) return;
    const currentCompleted = plan.completedTaskIds || [];
    const isCompleted = currentCompleted.includes(taskId);
    const updatedTaskIds = isCompleted
      ? currentCompleted.filter((id) => id !== taskId)
      : [...currentCompleted, taskId];

    const updatedPlan: PlanState = {
      ...plan,
      completedTaskIds: updatedTaskIds,
    };
    setPlan(updatedPlan);
    saveStoredStudyPlan(updatedPlan);

    if (!isCompleted) {
      toast.success('Task completed! Keep up the momentum! 🔥');
    }
  }

  function incrementProgress(subject: string, delta: number = 10) {
    if (!plan) return;
    const current = plan.subjectProgress[subject] ?? 0;
    const next = Math.min(100, Math.max(0, current + delta));
    const updated: PlanState = {
      ...plan,
      subjectProgress: { ...plan.subjectProgress, [subject]: next },
    };
    setPlan(updated);
    saveStoredStudyPlan(updated);
    if (next === 100) toast.success(`${subject} is 100% complete! 🏆`);
  }

  const [isEditingGoals, setIsEditingGoals] = useState(false);

  function handleEditGoals() {
    setIsEditingGoals(true);
    toast.info('Adjust your goals and click generate.');
  }

  function handleCopyPlan() {
    if (!plan) return;
    navigator.clipboard.writeText(plan.aiResponse);
    setCopied(true);
    toast.success('Study plan copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Render ──

  if (!hydrated) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-zinc-400">Loading your study planner…</p>
        </div>
      </div>
    );
  }

  if (!plan || isEditingGoals) {
    return (
      <InputForm
        form={form}
        setForm={setForm}
        subjectInput={subjectInput}
        setSubjectInput={setSubjectInput}
        handleFormChange={handleFormChange}
        addSubject={addSubject}
        removeSubject={removeSubject}
        handleSubjectKeyDown={handleSubjectKeyDown}
        handleGenerate={async () => {
          await handleGenerate();
          setIsEditingGoals(false);
        }}
        applyPreset={applyPreset}
        days={days}
        loading={loading}
        onCancel={plan ? () => setIsEditingGoals(false) : undefined}
      />
    );
  }

  return (
    <PlanDisplay
      plan={plan}
      days={days}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onToggleTask={toggleTaskCompletion}
      onIncrementProgress={incrementProgress}
      onEditGoals={handleEditGoals}
      onCopyPlan={handleCopyPlan}
      copied={copied}
      loading={loading}
    />
  );
}

// ─────────────────────────── Input Form (CRAFT-Style Calculator) ───────────────────────────

interface InputFormProps {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  subjectInput: string;
  setSubjectInput: (v: string) => void;
  handleFormChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  addSubject: (s?: string) => void;
  removeSubject: (s: string) => void;
  handleSubjectKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleGenerate: () => void;
  applyPreset: (p: typeof EXAM_PRESETS[0]) => void;
  days: number;
  loading: boolean;
  onCancel?: () => void;
}

function InputForm({
  form,
  setForm,
  subjectInput,
  setSubjectInput,
  handleFormChange,
  addSubject,
  removeSubject,
  handleSubjectKeyDown,
  handleGenerate,
  applyPreset,
  days,
  loading,
  onCancel,
}: InputFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  const canProceed1 = form.dailyHours > 0;
  const canProceed2 = form.examName.trim().length > 0 && form.examDate.length > 0;
  const canProceed3 = form.subjects.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* ════ CRAFT TWO-PANEL INVESTMENT CALCULATOR LAYOUT ════ */}
      <div className="overflow-hidden rounded-[32px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-blue-500/5 flex flex-col lg:flex-row min-h-[620px]">

        {/* ── LEFT PANEL: Authentic CRAFT Blue Sky + Clouds + Aircraft ── */}
        <div className="relative flex-shrink-0 lg:w-[45%] bg-gradient-to-b from-[#87bfee] via-[#a8d3f6] to-[#cce8fc] dark:from-[#0a192f] dark:via-[#0e2746] dark:to-[#091524] p-8 sm:p-10 flex flex-col justify-between overflow-hidden min-h-[320px] lg:min-h-0">

          {/* Ambient fluffy cloud shapes */}
          <div className="pointer-events-none absolute -top-12 -left-12 h-64 w-64 rounded-full bg-white/60 dark:bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-white/50 dark:bg-blue-600/10 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-10 left-10 h-56 w-80 rounded-full bg-white/70 dark:bg-white/5 blur-2xl" />

          {/* Top Brand Logo matching "≡ CRAFT" */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col gap-1 w-4">
                <span className="h-0.5 w-4 bg-zinc-900 dark:bg-white rounded-full" />
                <span className="h-0.5 w-3 bg-zinc-900 dark:bg-white rounded-full" />
                <span className="h-0.5 w-4 bg-zinc-900 dark:bg-white rounded-full" />
              </div>
              <span className="text-base font-black tracking-widest text-zinc-900 dark:text-white uppercase font-sans">
                eMate
              </span>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full bg-white/70 dark:bg-zinc-800/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-white transition cursor-pointer"
              >
                ✕ Close
              </button>
            )}
          </div>

          {/* Center: CRAFT Aircraft in clouds + Floating Frosted Capsule */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6">
            
            {/* Aerodynamic Aircraft soaring across cloudscape */}
            <div className="relative w-full max-w-[320px] h-32 flex items-center justify-center">
              <svg viewBox="0 0 420 180" className="w-full h-full drop-shadow-lg overflow-visible">
                {/* Airplane fuselage & wings */}
                <path
                  d="M50 88 Q140 68 250 72 L360 42 L360 62 L290 85 L380 94 L380 102 L280 95 L190 134 L170 134 L190 98 Q110 102 50 88 Z"
                  fill="white"
                  className="filter drop-shadow-md"
                />
                <path d="M190 98 L280 95 L240 85 Z" fill="#e2e8f0" />
                {/* Cockpit canopy */}
                <ellipse cx="80" cy="85" rx="14" ry="4.5" fill="#0f172a" />
                {/* Red livery stripe (matching CRAFT jet) */}
                <path d="M70 91 Q190 84 370 97" stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Turbofan engine */}
                <rect x="200" y="96" width="48" height="12" rx="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
              </svg>

              {/* Cumulus puffs hugging the airplane */}
              <div className="pointer-events-none absolute bottom-0 -left-4 h-14 w-32 rounded-full bg-white/80 blur-md" />
              <div className="pointer-events-none absolute -bottom-2 right-4 h-16 w-44 rounded-full bg-white/85 blur-lg" />
              <div className="pointer-events-none absolute top-2 right-0 h-10 w-28 rounded-full bg-white/60 blur-md" />
            </div>

            {/* Floating Frosted Pill Capsule (like [ TSLA ] <-> [ ✈️ Charter ] in CRAFT reference) */}
            <div className="mt-4 w-full max-w-[310px] rounded-full bg-white/85 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/90 dark:border-zinc-700/80 p-2 shadow-xl shadow-blue-900/10 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-2xs min-w-0 max-w-[125px]">
                <span className="text-sm">🎯</span>
                <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 truncate">
                  {form.examName || 'IPU BCA'}
                </span>
              </div>

              <div className="h-7 w-7 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
                <span className="text-xs text-zinc-600 dark:text-zinc-300 font-bold">⇄</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-2xs min-w-0 max-w-[125px]">
                <span className="text-sm">⚡</span>
                <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 truncate">
                  {form.dailyHours}h Runway
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Trust Badges (matching KPMG / Custodied with BofA / SEC in CRAFT) */}
          <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-zinc-700/90 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Syllabus-grounded
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Active recall paced
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              Synced with Study Mode ⓘ
            </span>
          </div>

        </div>

        {/* ── RIGHT PANEL: Step-by-Step Selection Grid matching CRAFT Calculator ── */}
        <div className="flex-1 bg-white dark:bg-zinc-900 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">

          {/* Top category tracking label & Step Title */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              AI STUDY ARCHITECT & RUNWAY CALCULATOR
            </p>

            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-zinc-900 dark:text-zinc-100">
              Step {step}:{' '}
              <strong className="font-black text-zinc-950 dark:text-white">
                {step === 1 && 'Daily study runway'}
                {step === 2 && 'Target exam & timeline'}
                {step === 3 && 'Subject portfolio'}
                {step === 4 && 'Preparation stage'}
              </strong>
            </h2>

            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-normal">
              {step === 1 && 'How many hours do you expect to study daily?'}
              {step === 2 && 'What exam are you preparing for and when is your test day?'}
              {step === 3 && 'Which subjects do you need to master before test day?'}
              {step === 4 && 'What is your current mastery level?'}
            </p>
          </div>

          {/* Center: The Step Body */}
          <div className="my-8 flex-1">

            {/* ── STEP 1: Study Usage (EXACTLY matching Image 1 Flight Usage) ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { h: 2, tag: '0-2 HOURS', title: 'Light usage', desc: 'Occasional trips & light review' },
                    { h: 4, tag: '3-4 HOURS', title: 'Moderate usage', desc: 'Regular study sessions & problem sets' },
                    { h: 6, tag: '5-6 HOURS', title: 'Heavy usage', desc: 'Frequent flyer & intensive exam immersion' },
                    { h: 8, tag: '7+ HOURS', title: 'Share your routes', desc: 'Tell us your specific study plan', isCustom: true },
                  ].map((opt) => {
                    const isSelected = opt.isCustom
                      ? form.dailyHours >= 7
                      : form.dailyHours === opt.h;

                    return (
                      <div
                        key={opt.tag}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, dailyHours: opt.h }));
                        }}
                        className={cn(
                          'relative cursor-pointer rounded-[24px] p-5 sm:p-6 min-h-[160px] flex flex-col justify-between transition-all duration-200',
                          isSelected
                            ? 'border-2 border-zinc-950 dark:border-white bg-white dark:bg-zinc-800 shadow-sm ring-1 ring-zinc-950/10'
                            : 'border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-600'
                        )}
                      >
                        {/* Top-left Radio Dot (matches Image 1) */}
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              'h-4 w-4 rounded-full flex items-center justify-center transition-colors',
                              isSelected
                                ? 'border-2 border-zinc-950 dark:border-white'
                                : 'border border-zinc-300 dark:border-zinc-700'
                            )}
                          >
                            {isSelected && (
                              <div className="h-2 w-2 rounded-full bg-zinc-950 dark:bg-white" />
                            )}
                          </div>
                          {opt.isCustom && (
                            <span className="text-zinc-500 text-xs">📍</span>
                          )}
                        </div>

                        {/* Bottom-left Grouped Text */}
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1">
                            {opt.tag}
                          </p>
                          <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            {opt.title}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Fine tune slider when custom or wanted */}
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-500">Fine-tune daily runway:</span>
                    <span className="text-sm font-black text-zinc-900 dark:text-white">
                      {form.dailyHours} hours/day · {form.dailyHours * 7}h/week
                    </span>
                  </div>
                  <input
                    type="range"
                    name="dailyHours"
                    value={form.dailyHours}
                    onChange={handleFormChange}
                    min={1}
                    max={12}
                    step={1}
                    className="w-full accent-zinc-950 dark:accent-white cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: Exam Target & Timeline ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {EXAM_PRESETS.slice(0, 4).map((p) => {
                    const isSelected = form.examName === p.name;
                    return (
                      <div
                        key={p.name}
                        onClick={() => applyPreset(p)}
                        className={cn(
                          'relative cursor-pointer rounded-[20px] p-4 flex flex-col justify-between transition-all duration-200 min-h-[110px]',
                          isSelected
                            ? 'border-2 border-zinc-950 dark:border-white bg-white dark:bg-zinc-800 shadow-sm'
                            : 'border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-400'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={cn(
                            'h-3.5 w-3.5 rounded-full flex items-center justify-center',
                            isSelected ? 'border-2 border-zinc-950 dark:border-white' : 'border border-zinc-300 dark:border-zinc-700'
                          )}>
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-white" />}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">{p.level}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{p.name}</p>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{p.subjects.join(', ')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Exam Name <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="examName"
                      value={form.examName}
                      onChange={handleFormChange}
                      placeholder="e.g. IPU BCA EXAM, JEE Advanced, NEET, Semester Finals…"
                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        Target Test Date <span className="text-blue-600">*</span>
                      </label>
                      {form.examDate && (
                        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-black text-zinc-900 dark:text-white">
                          {days <= 0 ? 'Today' : `${days} days runway`}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      name="examDate"
                      value={form.examDate}
                      min={today}
                      onChange={handleFormChange}
                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Subject Portfolio ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={handleSubjectKeyDown}
                    placeholder="Type subject name and press Enter…"
                    className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => addSubject()}
                    className="rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 px-5 text-sm font-bold shadow-xs hover:bg-black transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Quick Add Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400">Quick add:</span>
                  {POPULAR_SUBJECTS.filter((s) => !form.subjects.includes(s)).slice(0, 6).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSubject(s)}
                      className="rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 dark:hover:border-white dark:hover:text-white transition cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                {/* 2x2 Grid for Selected Subjects with Animated DeleteButton */}
                {form.subjects.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
                    {form.subjects.map((s) => (
                      <div
                        key={s}
                        className="relative rounded-[20px] border-2 border-zinc-950 dark:border-white bg-white dark:bg-zinc-800 p-3.5 flex items-start justify-between shadow-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="h-3 w-3 rounded-full border-2 border-zinc-950 dark:border-white flex items-center justify-center mb-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-white" />
                          </div>
                          <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                            MASTER SYLLABUS
                          </p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {s}
                          </p>
                        </div>
                        <DeleteButton
                          size="sm"
                          label="Remove"
                          title="Remove subject"
                          className="shrink-0"
                          onClick={() => removeSubject(s)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 py-4 text-center border border-dashed rounded-2xl">
                    Add at least 1 subject to generate your study timetable.
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 4: Preparation Stage (2x2 Cards) ── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'Beginner', code: '01 · FOUNDATION', label: 'Beginner', desc: 'Core definitions & fundamentals' },
                    { id: 'Intermediate', code: '02 · FORMULAS & DRILLS', label: 'Intermediate', desc: 'Syllabus partially covered, practice problems' },
                    { id: 'Advanced', code: '03 · PEAK ENDURANCE', label: 'Advanced', desc: 'High-yield drills, speed & mock exams' },
                    { id: 'Intermediate', isSprint: true, code: '04 · FINAL SPRINT', label: 'Sprint Mode', desc: 'High-priority topics & rapid active recall' },
                  ].map((lvl, idx) => {
                    const isSelected = (!lvl.isSprint && form.prepLevel === lvl.id) || (lvl.isSprint && days <= 14);
                    return (
                      <div
                        key={idx}
                        onClick={() => setForm((p) => ({ ...p, prepLevel: lvl.id as any }))}
                        className={cn(
                          'relative cursor-pointer rounded-[24px] p-5 sm:p-6 min-h-[140px] flex flex-col justify-between transition-all duration-200',
                          isSelected
                            ? 'border-2 border-zinc-950 dark:border-white bg-white dark:bg-zinc-800 shadow-sm ring-1 ring-zinc-950/10'
                            : 'border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-400'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            'h-4 w-4 rounded-full flex items-center justify-center',
                            isSelected ? 'border-2 border-zinc-950 dark:border-white' : 'border border-zinc-300 dark:border-zinc-700'
                          )}>
                            {isSelected && <div className="h-2 w-2 rounded-full bg-zinc-950 dark:bg-white" />}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1">
                            {lvl.code}
                          </p>
                          <p className="text-base font-bold text-zinc-900 dark:text-white">
                            {lvl.label}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                            {lvl.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ── BOTTOM ACTION BAR: Solid Black Pill Button matching CRAFT "See if you qualify" ── */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1) as any)}
                className="rounded-full border border-zinc-200 dark:border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                ← Back
              </button>
            ) : (
              <div className="text-xs text-zinc-400 font-medium">
                Step 1 of 4
              </div>
            )}

            {/* Signature CRAFT Full-Width Black Pill Button */}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !canProceed1) return;
                  if (step === 2 && !canProceed2) return;
                  if (step === 3 && !canProceed3) return;
                  setStep((s) => Math.min(4, s + 1) as any);
                }}
                disabled={(step === 1 && !canProceed1) || (step === 2 && !canProceed2) || (step === 3 && !canProceed3)}
                className="rounded-full bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 px-7 py-3.5 text-sm font-bold shadow-md transition-all active:scale-[0.99] disabled:opacity-40 cursor-pointer flex items-center gap-4"
              >
                <span>
                  {step === 1 ? 'Continue to target exam' : step === 2 ? 'Continue to subjects' : 'Set preparation stage'}
                </span>
                <span className="h-7 w-7 rounded-full bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center shrink-0">
                  <ArrowRight size={14} className="text-white dark:text-zinc-950" />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-full bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 px-8 py-3.5 text-sm font-bold shadow-md transition-all active:scale-[0.99] disabled:opacity-40 cursor-pointer flex items-center gap-4"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white dark:border-zinc-900 border-t-transparent" />
                    <span>Calculating study timetable…</span>
                  </>
                ) : (
                  <>
                    <span>See your study timetable</span>
                    <span className="h-7 w-7 rounded-full bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center shrink-0">
                      <Sparkles size={13} className="text-white dark:text-zinc-950" />
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

// ─────────────────────────── Plan Display (CRAFT-Style Dashboard) ───────────────────────────

interface PlanDisplayProps {
  plan: PlanState;
  days: number;
  activeTab: 'today' | 'weekly' | 'subjects' | 'milestones' | 'tips' | 'notes';
  setActiveTab: (t: 'today' | 'weekly' | 'subjects' | 'milestones' | 'tips' | 'notes') => void;
  onToggleTask: (id: string) => void;
  onIncrementProgress: (s: string, delta?: number) => void;
  onEditGoals: () => void;
  onCopyPlan: () => void;
  copied: boolean;
  loading: boolean;
}

function PlanDisplay({
  plan,
  days,
  activeTab,
  setActiveTab,
  onToggleTask,
  onIncrementProgress,
  onEditGoals,
  onCopyPlan,
  copied,
  loading,
}: PlanDisplayProps) {
  const { formData, subjectProgress, structured, completedTaskIds = [] } = plan;

  // Fallback structured data if missing
  const data: StructuredPlan = useMemo(() => {
    if (structured) return structured;
    const fallback = buildStructuredStudyPlan(formData, days);
    return fallback.structured;
  }, [structured, formData, days]);

  // Calculate completed task count
  const completedCount = completedTaskIds.length;
  const totalTasks = data.dailyRoutine.length;
  const taskProgressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Overall syllabus completion
  const subjects = formData.subjects;
  const avgProgress =
    subjects.length > 0
      ? Math.round(
          subjects.reduce((acc, s) => acc + (subjectProgress[s] ?? 0), 0) / subjects.length
        )
      : 0;

  const urgencyColor =
    days <= 7 ? { dot: 'bg-rose-500', text: 'Final Sprint', pill: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' }
    : days <= 30 ? { dot: 'bg-amber-500', text: 'High Intensity', pill: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' }
    : { dot: 'bg-emerald-500', text: 'Optimal Pacing', pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' };

  return (
    <div className="space-y-6">

      {/* ══ CRAFT BENTO DASHBOARD HEADER CARD ══ */}
      <div className="overflow-hidden rounded-[32px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">

        {/* Top row: Exam title + action buttons with CRAFT black pill button */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start gap-4 justify-between border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
                <Sparkles size={11} className="text-blue-600" />
                AI STUDY ROADMAP ACTIVE
              </span>
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold', urgencyColor.pill)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', urgencyColor.dot)} />
                {urgencyColor.text}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {formData.examName}
            </h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              Exam Target: <strong className="font-semibold text-zinc-700 dark:text-zinc-200">{formData.examDate}</strong>
              {' · '}Daily Focus: <strong className="font-semibold text-zinc-700 dark:text-zinc-200">{formData.dailyHours}h/day</strong>
              {' · '}Level: <strong className="font-semibold text-zinc-700 dark:text-zinc-200">{formData.prepLevel}</strong>
            </p>
          </div>

          {/* Action buttons — with signature CRAFT black pill */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onCopyPlan}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer shadow-2xs"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy Plan'}</span>
            </button>
            <button
              type="button"
              onClick={onEditGoals}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer shadow-2xs"
            >
              <Sliders size={13} />
              <span>Edit Goals</span>
            </button>
            <Link
              href={`/ai-topper-chat?topic=${encodeURIComponent(formData.examName)}`}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-950 px-5 py-2.5 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
            >
              <Brain size={13} />
              <span>Study Mode Active</span>
              <span className="h-5 w-5 rounded-full bg-white/20 dark:bg-zinc-900/20 flex items-center justify-center">
                <ArrowRight size={11} />
              </span>
            </Link>
          </div>
        </div>

        {/* ── 4 CRAFT DISCRETE METRIC CARDS GRID (Overhauling Image 2 into Image 1 Cards) ── */}
        <div className="p-6 sm:p-8 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Metric 1: Countdown Runway */}
            <div className="relative rounded-[24px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="flex h-3 w-3 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700">
                  <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', urgencyColor.dot)} />
                </span>
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', urgencyColor.pill)}>
                  {urgencyColor.text}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  COUNTDOWN RUNWAY
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={cn(
                    'text-3xl sm:text-4xl font-black tracking-tight',
                    days <= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'
                  )}>
                    {days <= 0 ? 'TODAY' : `${days} DAYS`}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-normal mt-0.5">
                  {days <= 0 ? 'Test day is today! Peak focus' : 'until test day'}
                </p>
              </div>
            </div>

            {/* Metric 2: Today's Checklist */}
            <div className="relative rounded-[24px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-zinc-900 dark:border-zinc-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {taskProgressPct}%
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  DAILY COMMITMENT
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                    {completedCount}
                  </span>
                  <span className="text-sm font-semibold text-zinc-400">/ {totalTasks} tasks</span>
                </div>
                <p className="text-xs text-zinc-500 font-normal mt-0.5">
                  {taskProgressPct}% completed today
                </p>
              </div>
            </div>

            {/* Metric 3: Syllabus Mastery */}
            <div className="relative rounded-[24px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Mastery
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  SYLLABUS COVERAGE
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {avgProgress}%
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">avg</span>
                </div>
                <p className="text-xs text-zinc-500 font-normal mt-0.5">
                  across {subjects.length} active subject{subjects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Metric 4: Total Prep Hours */}
            <div className="relative rounded-[24px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                </span>
                <span className="text-xs font-bold text-zinc-500">
                  {formData.dailyHours}h/day
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  TOTAL RUNWAY
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                    {days <= 0 ? formData.dailyHours : days * formData.dailyHours}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">HOURS</span>
                </div>
                <p className="text-xs text-zinc-500 font-normal mt-0.5">
                  dedicated study runway
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Task progress bar across the card bottom */}
        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-zinc-950 dark:bg-white transition-all duration-500 rounded-full"
            style={{ width: `${taskProgressPct}%` }}
          />
        </div>
      </div>

      {/* ══ NAVIGATION TABS (CRAFT Pill Segment Style) ══ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'today', label: "Today's Schedule", icon: ListTodo, badge: `${completedCount}/${totalTasks}` },
          { id: 'weekly', label: 'Weekly Timetable', icon: CalendarDays },
          { id: 'subjects', label: 'Subject Progress', icon: BarChart2, badge: `${avgProgress}%` },
          { id: 'milestones', label: 'Revision Milestones', icon: FlagIcon },
          { id: 'tips', label: 'Study Tactics', icon: Flame },
          { id: 'notes', label: 'Full Plan', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs',
                isActive
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400'
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  isActive
                    ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Today's Schedule */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Today&apos;s Time-Blocked Study Routine
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Click any task checkbox as you finish. Checkmarks persist automatically.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {taskProgressPct}% Done
              </span>
            </div>
          </div>

          {/* Daily Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${taskProgressPct}%` }}
            />
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {data.dailyRoutine.map((task) => {
              const isChecked = completedTaskIds.includes(task.id);
              return (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={cn(
                    'group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 sm:p-5 transition-all duration-150',
                    isChecked
                      ? 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                      : 'border-zinc-200/90 bg-white hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900'
                  )}
                >
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                  >
                    {isChecked ? (
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle size={20} className="text-zinc-300 hover:text-blue-600 dark:text-zinc-600" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-blue-700 dark:text-blue-400">
                        {task.timeSlot}
                      </span>
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {task.subject}
                      </span>
                      <span className="rounded-md border border-zinc-200/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                        {task.type}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        ({task.durationMinutes} mins)
                      </span>
                    </div>

                    <p
                      className={cn(
                        'mt-1.5 text-sm font-semibold transition',
                        isChecked
                          ? 'text-zinc-400 line-through dark:text-zinc-500'
                          : 'text-zinc-900 dark:text-zinc-100'
                      )}
                    >
                      {task.topic}
                    </p>
                  </div>

                  <Link
                    href={`/ai-topper-chat?topic=${encodeURIComponent(`${task.subject} - ${task.topic}`)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Brain size={12} />
                    <span>Ask AI</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Weekly Timetable */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              7-Day Pacing & Revision Timetable
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Balanced rotation designed to keep multiple subjects warm without cognitive fatigue.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.weeklyRoadmap.map((day) => (
              <div
                key={day.dayName}
                className={cn(
                  'rounded-2xl border p-5 transition shadow-2xs',
                  day.dayName === 'Sunday'
                    ? 'border-blue-300/80 bg-blue-50/40 dark:border-blue-900/70 dark:bg-blue-950/20'
                    : 'border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                    {day.dayName}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {day.hours}h Study
                  </span>
                </div>

                <p className="mt-2 text-xs font-bold text-blue-700 dark:text-blue-400">
                  {day.focusTheme}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {day.subjects.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <ul className="mt-3.5 space-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                  {day.tasks.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Subject Progress & Allocation */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Subject Allocation & Mastery Tracking
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Use the +10% and -10% buttons to record syllabus milestones.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {data.subjectStrategies.map((strat) => {
              const currentPct = subjectProgress[strat.subject] ?? 0;
              return (
                <div
                  key={strat.subject}
                  className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                        {strat.subject}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {strat.weightPercentage}% weight · ~{strat.dailyHours}h/day
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onIncrementProgress(strat.subject, -10)}
                        disabled={currentPct <= 0}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
                      >
                        -10%
                      </button>
                      <button
                        type="button"
                        onClick={() => onIncrementProgress(strat.subject, 10)}
                        disabled={currentPct >= 100}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                      >
                        +10%
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span className="text-zinc-500">Progress</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{currentPct}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          currentPct >= 80 ? 'bg-emerald-500' : 'bg-blue-600'
                        )}
                        style={{ width: `${currentPct}%` }}
                      />
                    </div>
                  </div>

                  {/* High Yield Topics */}
                  <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      High-Yield Topics:
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {strat.highYieldTopics.map((t, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Strategy Advice */}
                  <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    💡 <strong className="font-semibold text-zinc-700 dark:text-zinc-300">Tactic:</strong> {strat.keyAdvice}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Revision Milestones */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Phased Revision Roadmap to Exam Day
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Structured countdown phases designed to peak your memory recall right on exam week.
            </p>
          </div>

          <div className="space-y-4">
            {data.revisionMilestones.map((ms, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {ms.phase}
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-500">
                    {ms.timeframe}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {ms.milestoneTitle}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Objective: {ms.objective}
                </p>

                <ul className="mt-3.5 space-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                  {ms.actions.map((act, aIdx) => (
                    <li key={aIdx} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Study Tactics & Science */}
      {activeTab === 'tips' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Cognitive Study Tactics & Memory Science
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Proven active-recall and retention frameworks for high-performing test takers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {data.highYieldTips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shrink-0">
                  <Sparkles size={16} />
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Complete Markdown Plan Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Complete Markdown Plan Summary
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Formatted markdown document for printing, offline reading, or note apps.
              </p>
            </div>
            <button
              type="button"
              onClick={onCopyPlan}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {plan.aiResponse}
            </pre>
          </div>
        </div>
      )}

      {/* Sticky Bottom Synced Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-5 dark:border-blue-900 dark:bg-blue-950/40">
        <div>
          <p className="text-sm font-extrabold text-blue-950 dark:text-blue-100">
            Synced with AI Topper (Study Mode)
          </p>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/80">
            Any questions asked in Study Mode automatically adapt to your {days}-day exam schedule.
          </p>
        </div>
        <Link
          href={`/ai-topper-chat?topic=${encodeURIComponent(formData.examName)}`}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-blue-700 active:scale-95 cursor-pointer"
        >
          <Brain size={15} />
          <span>Launch Study Chat</span>
          <ArrowRight size={13} />
        </Link>
      </div>

    </div>
  );
}

function FlagIcon({ size = 15, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
