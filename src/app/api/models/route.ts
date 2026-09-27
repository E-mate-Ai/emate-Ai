import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate-ai.runs-on.dev',
        'X-Title': 'e-Mate AI',
      },
      next: { revalidate: 3600 }, // Cache models list for 1 hour
    });

    if (!res.ok) {
      throw new Error(`OpenRouter models API failed: ${res.statusText}`);
    }

    const data = await res.json();

    // Filter models that cost 0 for both prompt (input) and completion (output)
    const freeModels = (data.data || [])
      .filter((model: any) => {
        const pricing = model.pricing || {};
        return pricing.prompt === '0' && pricing.completion === '0';
      })
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
      }));

    // Fallback curated free models list if filter returns empty
    const curatedFreeModels = [
      { id: 'openrouter/auto', name: 'Auto (Best Available Free Model)' },
      { id: 'google/gemma-2-9b-it:free', name: 'Google Gemma 2 9B (General Knowledge)' },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Meta Llama 3.1 8B (Fast Chat)' },
      { id: 'qwen/qwen-2.5-7b-instruct:free', name: 'Qwen 2.5 7B (Coding & Math)' },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Logic & Writing)' },
    ];

    const result = freeModels.length > 0 ? freeModels : curatedFreeModels;

    return NextResponse.json({ models: result });
  } catch (err: any) {
    return NextResponse.json({
      models: [
        { id: 'openrouter/auto', name: 'Auto (Best Available Free Model)' },
        { id: 'google/gemma-2-9b-it:free', name: 'Google Gemma 2 9B (General Knowledge)' },
        { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Meta Llama 3.1 8B (Fast Chat)' },
        { id: 'qwen/qwen-2.5-7b-instruct:free', name: 'Qwen 2.5 7B (Coding & Math)' },
        { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Logic & Writing)' },
      ],
    });
  }
}
