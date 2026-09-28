import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'e-Mate FAQ | AI Study Assistant Questions',
  description:
    'Find answers about e-Mate, how the AI study assistant works, what it supports, and how students can use it to improve revision and exam prep.',
  alternates: {
    canonical: '/faq',
  },
};

const faqs = [
  {
    question: 'What is e-Mate?',
    answer:
      'e-Mate is an AI-powered study assistant that helps students plan revision, practice concepts, generate flashcards, and improve exam preparedness through structured study support.',
  },
  {
    question: 'Who is e-Mate for?',
    answer:
      'It is designed for students, exam takers, and learners who want a more guided and productive way to revise, learn, and prepare for assessments.',
  },
  {
    question: 'Does e-Mate replace a tutor?',
    answer:
      'No. It is designed to complement study routines by creating structured support, explanations, quizzes, and revision tasks rather than replacing a teacher or mentor.',
  },
  {
    question: 'Can I use it for exam preparation?',
    answer:
      'Yes. e-Mate is focused on helping students with planning, active recall, revision, and concept understanding in the lead-up to exams.',
  },
];

export default function FAQPage() {
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <AppLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
            FAQ
          </div>

          <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
            Frequently asked questions about e-Mate
          </h1>

          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <h2 className="text-lg font-bold text-zinc-900">{item.question}</h2>
                <p className="mt-2 text-zinc-600">{item.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/ai-topper-chat"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
            >
              Try e-Mate now
            </Link>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
