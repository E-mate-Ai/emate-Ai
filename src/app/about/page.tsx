import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'About e-Mate AI | Personalized Study Assistant',
  description:
    'Learn what e-Mate is, who it is built for, and how it helps students study smarter with AI-powered planning, revision, and exam preparation.',
  alternates: {
    canonical: '/about',
  },
};

const points = [
  'Built for students who want a clearer learning workflow instead of generic AI chat.',
  'Designed around syllabus, revision, weak-areas, active recall, and exam readiness.',
  'Helps learners convert notes, questions, and goals into a concrete study system.',
  'Made to support better study habits, not just instant answers.',
];

export default function AboutPage() {
  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
            About e-Mate
          </div>

          <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
            e-Mate helps students study with structure, not guesswork.
          </h1>

          <p className="mt-5 max-w-3xl text-lg text-zinc-600">
            e-Mate is an AI-powered study assistant designed for learners who want a more organized way to prepare for exams. It brings together syllabus context, revision planning, practice questions, concept explanations, and continuous feedback so students can study with less stress and more focus.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {points.map((point) => (
              <div key={point} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                {point}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-900">Who it is for</h2>
            <p className="mt-3 text-zinc-600">
              e-Mate is built for students, exam takers, and learners who need a clearer path from syllabus to revision to confidence before the test.
            </p>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-900">What makes it different</h2>
            <p className="mt-3 text-zinc-600">
              It focuses on learning flow — study plan, practice, weak area detection, and revision — rather than treating AI as a generic chatbot.
            </p>
          </article>
        </section>

        <section className="mt-12 text-center">
          <Link
            href="/ai-topper-chat"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
          >
            Try e-Mate
          </Link>
        </section>
      </main>
    </AppLayout>
  );
}
