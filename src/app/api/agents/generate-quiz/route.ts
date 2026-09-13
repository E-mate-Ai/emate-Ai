import { generateQuiz } from '@/lib/agents/mcqAgent';

export const dynamic = 'force-dynamic';

function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
}

export async function POST(req: Request) {
  try {
    const { subject, unit, count, difficulty, notebookContext } = await req.json();

    const cookieHeader = req.headers.get('cookie');
    const userKey = getCookie(cookieHeader, 'user_openrouter_key');
    const apiKey =
      userKey || process.env.OPENROUTER_SERVER_FREE_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
      return new Response(
        JSON.stringify({
          error: 'OpenRouter API key is missing. Please connect your OpenRouter account.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const quiz = await generateQuiz(apiKey, {
      subject: subject || '',
      unit: unit || '',
      count: Math.min(Math.max(count || 5, 1), 20),
      difficulty: difficulty || 'medium',
      notebookContext: notebookContext || '',
    });

    return new Response(JSON.stringify(quiz), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[generate-quiz] Error:', err.message, err.raw ? `(raw: ${err.raw})` : '');
    return new Response(JSON.stringify({ error: err.message || 'Failed to generate quiz.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
