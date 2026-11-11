import type { Metadata } from 'next';
import Script from 'next/script';
import AppLayout from '@/components/AppLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import StudyPlannerClient from './StudyPlannerClient';

export const metadata: Metadata = {
  title: 'AI Study Planner & Exam Schedule Builder',
  description:
    'Build realistic, syllabus-grounded daily study plans with e-Mate AI. Pace your exam revision, schedule active recall sessions, and hit your academic milestones.',
  keywords: [
    'AI study planner',
    'exam study schedule AI',
    'revision timetable generator',
    'study schedule builder',
    'syllabus revision planner',
    'exam countdown planner',
    'e-Mate AI',
    'emate.live',
  ],
  alternates: {
    canonical: '/ai-study-planner',
  },
  openGraph: {
    title: 'AI Study Planner & Exam Schedule Builder — e-Mate AI',
    description:
      'Build realistic, syllabus-grounded daily study plans with e-Mate AI. Pace your exam revision, schedule active recall sessions, and hit your academic milestones.',
    url: '/ai-study-planner',
    siteName: 'e-Mate AI',
    type: 'website',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Study Planner & Exam Schedule Builder — e-Mate AI',
    description:
      'Build realistic, syllabus-grounded daily study plans with e-Mate AI. Pace your exam revision, schedule active recall sessions, and hit your academic milestones.',
    images: ['/opengraph-image.png'],
  },
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://emate.live';

export default function AIStudyPlannerPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'e-Mate AI Study Planner',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    url: `${siteUrl}/ai-study-planner`,
    description:
      'AI-powered study planner that turns syllabi and exam deadlines into realistic, active recall study schedules.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <AppLayout>
      <Script
        id="study-planner-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: 'AI Study Planner', href: '/ai-study-planner' }]}
          className="mb-6"
        />
        <StudyPlannerClient />
      </main>
    </AppLayout>
  );
}
