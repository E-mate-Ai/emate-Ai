import { openRouterCompletion } from '@/lib/openrouter';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export type DocumentFormat = 'docx' | 'pptx' | 'pdf' | 'markdown';

export interface GenerateDocumentRequest {
  prompt: string;
  format?: DocumentFormat;
  title?: string;
  userApiKey?: string;
}

function getApiKey(req: Request, bodyKey?: string): string | null {
  const authHeader = req.headers.get('authorization');
  const authHeaderKey = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
  const cookieHeader = req.headers.get('cookie');
  const cookieKey = cookieHeader
    ? cookieHeader
        .split(';')
        .find((c) => c.trim().startsWith('user_openrouter_key='))
        ?.split('=')[1]
    : undefined;

  return (
    authHeaderKey ||
    bodyKey ||
    (cookieKey ? decodeURIComponent(cookieKey) : undefined) ||
    process.env.OPENROUTER_SERVER_FREE_KEY ||
    process.env.OPENROUTER_API_KEY ||
    null
  );
}

const SYSTEM_PROMPT_DOCX = `You are an expert document writer and formatter integrated directly into e-Mate AI's document export engine.
Your output is compiled automatically by the server into genuine Microsoft Word (.docx) documents.

CRITICAL INSTRUCTIONS:
- NEVER say "I can't create actual files" or give any disclaimer. The server compiles your response directly into real .docx files.
- Do NOT provide ANY introductory greeting, preamble, conversation, or meta-commentary.
- Output ONLY the complete, structured document in Markdown format.
- Start IMMEDIATELY with the document title (# Document Title).

Document Structure:
- Clear Title (# Title)
- Well-organized sections (## Section, ### Subsection)
- Bullet points and numbered lists where appropriate
- Bold and italic text for key emphasis
- Tables where data needs comparison
- Clear introduction and comprehensive body sections
- Actionable conclusions or executive summary`;

const SYSTEM_PROMPT_PPTX = `You are an expert presentation designer and slide structure compiler for e-Mate AI.
Your output is sent directly into e-Mate's PowerPoint .pptx compilation engine that automatically builds real presentation decks for the user.

CRITICAL INSTRUCTIONS:
- You MUST output ONLY the slide markers and slide content using the EXACT format below.
- Do NOT include ANY introductory greeting, preamble, apology, or disclaimers.
- NEVER say "I can't create actual .pptx files" or "I cannot make PowerPoint files" — the system compiles your output directly into real .pptx files!
- Start IMMEDIATELY with the first slide marker: ---SLIDE: Title---

Format your output EXACTLY like this:

---SLIDE: Title Slide---
## Presentation Title
**Subtitle** - Brief description or target audience
[Speaker notes: Introduction and agenda overview]

---SLIDE: Agenda---
## Agenda & Roadmap
**Key Area 1** - Overview of first topic
**Key Area 2** - Overview of second topic
**Key Area 3** - Summary and action steps
[Speaker notes: Walk through the presentation structure]

---SLIDE: Topic One---
## Topic One Title
**Main Insight** - Detailed explanation
**Supporting Data** - Metrics or relevant facts
**Takeaway** - Actionable conclusion
[Speaker notes: Explanation for the presenter]

Rules:
- Generate 6-10 comprehensive, high-value slides.
- Each slide MUST start with "---SLIDE: [Slide Name]---"
- Provide 3-5 punchy, bullet points with bold prefixes per slide.
- Include thoughtful speaker notes in "[Speaker notes: ...]" on each slide.
- Do NOT output any text before the first "---SLIDE:" or after the last slide.`;

function getSystemPrompt(format: DocumentFormat): string {
  if (format === 'pptx') return SYSTEM_PROMPT_PPTX;
  return SYSTEM_PROMPT_DOCX;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as GenerateDocumentRequest;
    const { prompt, format = 'docx', title, userApiKey: bodyKey } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return Response.json({ error: 'A prompt is required to generate a document.' }, { status: 400 });
    }

    const apiKey = getApiKey(req, bodyKey);
    if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
      return Response.json(
        {
          error: 'Document generation requires an API key. Please sign in or connect your OpenRouter key.',
          code: 'auth_required',
        },
        { status: 403 }
      );
    }

    const systemPrompt = getSystemPrompt(format);
    const userPrompt = title
      ? `Generate the ${format === 'pptx' ? 'presentation slides' : 'document'} titled "${title}" about: ${prompt}`
      : `Generate the ${format === 'pptx' ? 'presentation slides' : 'document'} about: ${prompt}`;

    const response = await openRouterCompletion(apiKey, {
      model: 'emate',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const rawContent = (response as any)?.choices?.[0]?.message?.content;
    if (!rawContent || typeof rawContent !== 'string') {
      return Response.json({ error: 'Failed to generate document content. Please try again.' }, { status: 500 });
    }

    // ── Sanitize content & strip any AI preamble or disclaimer ───────────────
    let cleanContent = rawContent.trim();

    if (format === 'pptx') {
      const slideIndex = cleanContent.indexOf('---SLIDE:');
      if (slideIndex > -1) {
        cleanContent = cleanContent.slice(slideIndex).trim();
      } else {
        // Strip common AI disclaimers if slide marker is missing
        cleanContent = cleanContent
          .replace(/^I can'?t create actual (?:files|\.pptx|\.docx)[\s\S]*?(?:\n\n|\n(?=[#\-\*]))/i, '')
          .replace(/^Here (?:is|are) (?:a |the )?(?:presentation|slides?).*?:\n+/i, '')
          .trim();
      }
    } else {
      // Strip any preamble before the first markdown header
      const headerIndex = cleanContent.search(/^#\s+/m);
      if (headerIndex > 0) {
        cleanContent = cleanContent.slice(headerIndex).trim();
      } else {
        cleanContent = cleanContent
          .replace(/^I can'?t create actual (?:files|\.pptx|\.docx)[\s\S]*?(?:\n\n|\n(?=[#\-\*]))/i, '')
          .trim();
      }
    }

    // Extract title from content if not provided
    const extractedTitle =
      title ||
      (() => {
        const firstLine = cleanContent.split('\n').find((l) => l.startsWith('# '));
        if (firstLine) return firstLine.replace(/^#\s*/, '').trim();
        const slideLine = cleanContent.split('\n').find((l) => l.startsWith('## '));
        if (slideLine) return slideLine.replace(/^##\s*/, '').trim();
        return prompt.slice(0, 60);
      })();

    return Response.json({
      content: cleanContent,
      title: extractedTitle,
      format,
      wordCount: cleanContent.split(/\s+/).length,
    });
  } catch (err: any) {
    const status = err?.status || 500;
    const message = err?.message || 'Document generation failed. Please try again.';
    return Response.json({ error: message }, { status });
  }
}
