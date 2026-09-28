import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'AI Study Planner for Exams | e-Mate',
  description:
    'Plan smarter study sessions with an AI study planner built for revision, exam prep, syllabus coverage, and better time management.',
  alternates: {
    canonical: '/ai-study-planner',
  },
};

const items = [
  'Break your syllabus into manageable study blocks',
  'Create daily or weekly revision plans around your deadlines',
  'Focus on weak topics before high-stakes exams',
  'Keep study sessions structured and realistic',
];

export default function AIStudyPlannerPage() {
  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
            AI study planner
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
                AI study planner for exam prep and revision.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-zinc-600">
                e-Mate turns your subject list, deadlines, and revision goals into a clear study roadmap that helps you stay consistent and improve faster.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/ai-topper-chat"
                  className="inline-flex items-center justify-center rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Build my study plan
                </Link>
                <Link
                  href="/ai-exam-prep"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  See exam prep tools
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5">
              <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white">
                <p className="text-sm font-medium text-violet-100">Study roadmap</p>
                <p className="mt-3 text-2xl font-bold">Plan smarter. Revise harder. Perform better.</p>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-violet-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-900">For students with deadlines</h2>
            <p className="mt-3 text-zinc-600">
              Whether you are preparing for finals, unit tests, or a major competitive exam, e-Mate keeps your revision structured and realistic.
            </p>
          </article>
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-900">For students who want focus</h2>
            <p className="mt-3 text-zinc-600">
              The AI study planner helps you prioritize the topics that matter most, not just the tasks that feel urgent.
            </p>
          </article>
        </section>
      </main>
    </AppLayout>
  );
}
