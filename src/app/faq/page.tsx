import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import AppLayout from '@/components/AppLayout';
import PublicFooter from '@/components/PublicFooter';
import { Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ — Common Questions About e-Mate AI',
  description:
    'Find answers about how e-Mate AI works, syllabus PDF uploads, AI flashcard generation, practice quizzes, exam revision planners, and student data privacy.',
  keywords: [
    'e-Mate AI FAQ',
    'frequently asked questions',
    'AI flashcards help',
    'study copilot FAQ',
    'e-Mate AI',
    'emate.live',
  ],
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ — Common Questions About e-Mate AI',
    description:
      'Find answers about how e-Mate AI works, syllabus PDF uploads, AI flashcard generation, practice quizzes, and student data privacy.',
    url: '/faq',
    siteName: 'e-Mate AI',
    type: 'website',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ — Common Questions About e-Mate AI',
    description:
      'Find answers about how e-Mate AI works, syllabus PDF uploads, AI flashcard generation, practice quizzes, and student data privacy.',
    images: ['/opengraph-image.png'],
  },
};

const faqs = [
  {
    question: 'What is e-Mate AI and how does it help students?',
    answer:
      'e-Mate AI is an intelligent academic study copilot built for students preparing for school, university, and competitive exams. Unlike generic AI chatbots, e-Mate structures your study workflow around your exact syllabus, converts textbooks and notes into active recall flashcards, generates adaptive practice quizzes, and pinpoints your knowledge gaps before test day.',
  },
  {
    question: 'How does the AI Flashcard Generator work?',
    answer:
      'You can enter any topic, subject, or paste your lecture notes, and e-Mate AI instantly extracts core definitions, key formulas, and conceptual relationships to build physical-style visual flashcards. Each card supports active recall and spaced repetition rating (Easy, Good, Hard), helping you systematically reinforce long-term memory.',
  },
  {
    question: 'Can I upload my syllabus PDFs or class notes?',
    answer:
      'Yes. e-Mate AI allows you to attach lecture notes, syllabus outlines, and textbook PDFs directly into your Subject Notebooks. The AI uses contextual retrieval (RAG) to anchor its explanations, quiz questions, and study timelines strictly to your curriculum without hallucinating external irrelevant material.',
  },
  {
    question: 'How does the AI Quiz Generator create practice questions?',
    answer:
      'The AI Quiz Generator analyzes your syllabus topics or uploaded chapters and formulates multiple-choice questions (MCQs), conceptual queries, and reasoning challenges with varying difficulty levels. After each answer, it gives instant pedagogical feedback explaining why options are correct or incorrect.',
  },
  {
    question: 'What makes e-Mate AI different from ChatGPT or other chatbots?',
    answer:
      'General conversational chatbots provide raw answers that often encourage passive reading. e-Mate is built specifically as a learning environment: it guides you with structured study sessions, forces active recall through quizzes and flashcards, tracks weak subjects over time, and creates concrete revision countdowns designed for exam pressure.',
  },
  {
    question: 'Is student data, notes, and uploaded material kept private?',
    answer:
      'Absolutely. We adhere to strict student privacy protection standards. All uploaded documents, notebook entries, and study transcripts are securely encrypted. We do not sell student data, nor do we train public AI models on your private coursework notes.',
  },
  {
    question: 'Is e-Mate AI free to use?',
    answer:
      'Yes! e-Mate offers a generous free tier with complimentary credits that allow any student to create flashcard decks, generate quizzes, and study with AI. For students requiring higher token throughput, priority compute, or unlimited document parsing, optional Pro and Ultra upgrades are available.',
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
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            Frequently Asked Questions
          </div>

          <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            Everything you need to know about e-Mate AI
          </h1>

          <p className="mt-4 max-w-3xl text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Have questions about how e-Mate organizes your syllabus, builds active recall study decks, or protects your coursework? Find answers below.
          </p>

          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition dark:border-zinc-800 dark:bg-zinc-800/60"
              >
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-start gap-3">
                  <HelpCircle className="mt-1 text-blue-600 dark:text-blue-400 shrink-0" size={18} />
                  <span>{item.question}</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 pl-7">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-blue-50/50 p-6 dark:border-zinc-800 dark:bg-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm text-zinc-900 dark:text-white">Ready to start studying smarter?</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Join thousands of students building high-yield revision routines.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <Sparkles size={15} />
              <span>Launch Workspace</span>
            </Link>
          </div>
        </section>

        <PublicFooter />
      </main>
    </AppLayout>
  );
}
