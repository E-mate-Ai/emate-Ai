import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'AI Flashcard Generator for Students | e-Mate',
  description:
    'Generate active-recall flashcards from your notes and topics with e-Mate and turn revision into a faster, more memorable study habit.',
  alternates: {
    canonical: '/ai-flashcard-generator',
  },
};

const features = [
  'Turn notes into question-and-answer revision cards',
  'Focus on high-yield facts, formulas, and problem-solving steps',
  'Use active recall instead of passive rereading',
  'Improve speed and retention before exams',
];

export default function AIFlashcardGeneratorPage() {
  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
            AI flashcards
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
                AI flashcard generator for faster recall and stronger revision.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-zinc-600">
                e-Mate helps you convert study notes into compact, memorable flashcards so you spend less time rereading and more time actively testing yourself.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/ai-topper-chat"
                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  Generate flashcards
                </Link>
                <Link
                  href="/ai-study-assistant"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  Explore study assistant
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5">
              <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 text-white shadow-lg">
                <p className="text-sm font-medium text-amber-100">Memory loop</p>
                <p className="mt-3 text-2xl font-bold">Recall → Check → Repeat</p>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>{feature}</span>
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
