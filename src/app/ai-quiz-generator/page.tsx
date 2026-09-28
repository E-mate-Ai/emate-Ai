import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'AI Quiz Generator for Students | e-Mate',
  description:
    'Turn your subject notes into smart practice quizzes with e-Mate and strengthen recall before your exams with active self-testing.',
  alternates: {
    canonical: '/ai-quiz-generator',
  },
};

const items = [
  'Create quick quizzes from your topic or syllabus',
  'Practice active recall in short, focused sessions',
  'Target weak areas before the next test',
  'Turn revision into measurable progress',
];

export default function AIQuizGeneratorPage() {
  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-pink-700">
            AI quiz generator
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
                AI quiz generator for active recall and exam practice.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-zinc-600">
                Build revision quizzes from any topic, chapter, or set of notes and increase retention by checking what you actually know before the exam.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/ai-topper-chat"
                  className="inline-flex items-center justify-center rounded-full bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
                >
                  Create quiz practice
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
              <div className="rounded-2xl bg-gradient-to-br from-pink-600 to-rose-500 p-4 text-white shadow-lg">
                <p className="text-sm font-medium text-pink-100">Practice loop</p>
                <p className="mt-3 text-2xl font-bold">Test. Learn. Improve.</p>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-pink-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
