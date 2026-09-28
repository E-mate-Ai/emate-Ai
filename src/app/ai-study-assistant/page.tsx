import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'AI Study Assistant for Students | e-Mate',
  description:
    'Turn your syllabus, notes, and exam goals into a personalized AI study flow with revision plans, quizzes, and adaptive learning support.',
  alternates: {
    canonical: '/ai-study-assistant',
  },
};

const features = [
  'Create a study plan from your syllabus or exam goals',
  'Turn notes into active-recall flashcards and short quizzes',
  'Get revision checklists and weak-area detection',
  'Stay consistent with structured study sessions',
];

const steps = [
  {
    title: 'Add your subject and syllabus',
    text: 'Upload notes, class material, or a topic list and let e-Mate organize the most important concepts.',
  },
  {
    title: 'Build a personalized study flow',
    text: 'The assistant turns your material into daily revision tasks, practice quizzes, and targeted review prompts.',
  },
  {
    title: 'Track where you are weak',
    text: 'Repeated practice highlights the concepts you are missing so your study time is focused instead of wasted.',
  },
];

export default function AIStudyAssistantPage() {
  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
            AI study assistant
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
                AI study assistant for students who want smarter revision.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-zinc-600">
                e-Mate helps students plan study sessions, practice concepts, review weak areas, and stay exam-ready with an AI workflow built around learning, not random chat.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/ai-topper-chat"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Start studying with e-Mate
                </Link>
                <Link
                  href="/upgrade"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  View plans
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white shadow-lg">
                <p className="text-sm font-medium text-blue-100">Study flow</p>
                <p className="mt-3 text-2xl font-bold">Syllabus → Plan → Practice → Revise</p>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {steps.indexOf(step) + 1}
              </div>
              <h2 className="text-xl font-bold text-zinc-900">{step.title}</h2>
              <p className="mt-3 text-zinc-600">{step.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-[28px] border border-zinc-200 bg-zinc-50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-zinc-900">Why students use e-Mate</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">More focused revision</h3>
              <p className="mt-2 text-zinc-600">
                Instead of generic chat answers, e-Mate keeps your study context in view so it can help with the exact subject, unit, and exam goals you are targeting.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Less wasted time</h3>
              <p className="mt-2 text-zinc-600">
                AI-generated quizzes and revision prompts help students move from passive reading to active recall and exam-style practice.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 text-center">
          <h2 className="text-3xl font-black tracking-tight text-zinc-900">
            Build a study routine that adapts as you learn.
          </h2>
          <Link
            href="/ai-topper-chat"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
          >
            Try e-Mate now
          </Link>
        </section>
      </main>
    </AppLayout>
  );
}
