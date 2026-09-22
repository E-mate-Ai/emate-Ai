import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';
import { retrieveAndRerankChunks } from '@/lib/retrieval/topKRetrieval';

export const dynamic = 'force-dynamic';

/**
 * GET /api/retrieval/test?q=your+query&rerank=true
 * Diagnostic endpoint to test two-stage retrieval (pgvector + hybrid re-ranking).
 */
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('q') || 'What are the main concepts of operating system synchronization?';
    const k = parseInt(req.nextUrl.searchParams.get('k') || '5', 10);
    const filterDocId = req.nextUrl.searchParams.get('docId') || undefined;
    const enableReranking = req.nextUrl.searchParams.get('rerank') !== 'false';

    const supabase = await createSupabaseServer();

    const result = await retrieveAndRerankChunks({
      query,
      k,
      filterDocumentId: filterDocId,
      enableReranking,
      supabaseClient: supabase,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to execute retrieval diagnostic.',
      },
      { status: 500 }
    );
  }
}
