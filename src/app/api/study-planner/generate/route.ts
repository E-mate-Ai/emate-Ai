import { NextResponse } from 'next/server';
import {
  buildStructuredStudyPlan,
  type StructuredPlan,
} from '@/lib/studyPlannerService';
import type { StudyPlanFormData, StudyPlan, SubjectProgress } from '@/lib/studyPlan';
import { daysRemaining } from '@/lib/studyPlan';

export const dynamic = 'force-dynamic';

function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<StudyPlanFormData> & {
      userApiKey?: string;
    };

    if (!body.examName || !body.examName.trim()) {
      return NextResponse.json(
        { error: 'An exam name is required to build a study plan.' },
        { status: 400 }
      );
    }

    const form: StudyPlanFormData = {
      examName: body.examName.trim(),
      examDate: body.examDate || '',
      subjects: Array.isArray(body.subjects) && body.subjects.length > 0 ? body.subjects : ['General Studies'],
      dailyHours: typeof body.dailyHours === 'number' ? body.dailyHours : 4,
      prepLevel: body.prepLevel || 'Intermediate',
      topics: body.topics?.trim() || '',
    };

    const daysLeft = daysRemaining(form.examDate);

    // Initial progress table for each subject
    const initialProgress: SubjectProgress = {};
    form.subjects.forEach((s) => {
      initialProgress[s] = 0;
    });

    // 1. Build initial high-grade structured study plan
    const generated = buildStructuredStudyPlan(form, daysLeft);

    // 2. Optionally attempt AI enhancement via OpenRouter if key is present
    const cookieHeader = req.headers.get('cookie');
    const authHeader = req.headers.get('authorization');
    const authKey = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
    const userCookieKey = getCookie(cookieHeader, 'user_openrouter_key');

    const apiKey =
      (typeof body.userApiKey === 'string' && body.userApiKey.trim() ? body.userApiKey.trim() : undefined) ||
      authKey ||
      userCookieKey ||
      process.env.OPENROUTER_SERVER_FREE_KEY ||
      process.env.OPENROUTER_API_KEY;

    let finalMarkdown = generated.markdown;
    let finalStructured: StructuredPlan = generated.structured;

    if (apiKey && apiKey !== 'your-openrouter-api-key-here') {
      try {
        const aiPrompt = `You are a world-class academic study coach. Refine and enhance this study timetable for a student preparing for:
Exam: ${form.examName}
Exam Date: ${form.examDate} (${daysLeft} days left)
Daily Hours: ${form.dailyHours} hours/day
Level: ${form.prepLevel}
Subjects: ${form.subjects.join(', ')}
Key Topics: ${form.topics || 'Comprehensive syllabus'}

Provide 3 ultra-specific, high-yield actionable tips and customize today's study routine with specific topics for ${form.subjects.join(', ')}. Return clean, concise markdown.`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://emate.live',
            'X-Title': 'e-Mate AI Study Planner',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: [
              {
                role: 'system',
                content: 'You are an elite academic tutor creating concise, high-yield study plans.',
              },
              { role: 'user', content: aiPrompt },
            ],
            max_tokens: 3000,
            temperature: 0.6,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content && typeof content === 'string' && content.length > 100) {
            finalMarkdown = `${content.trim()}\n\n---\n\n${generated.markdown}`;
          }
        }
      } catch (err) {
        // Graceful fallback to algorithmic generated plan
        console.warn('AI enhancement skipped, using structured generator:', err);
      }
    }

    const plan: StudyPlan = {
      formData: form,
      aiResponse: finalMarkdown,
      structured: finalStructured,
      subjectProgress: initialProgress,
      completedTaskIds: [],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, plan }, { status: 200 });
  } catch (error: any) {
    console.error('[/api/study-planner/generate] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate study plan.' },
      { status: 500 }
    );
  }
}

