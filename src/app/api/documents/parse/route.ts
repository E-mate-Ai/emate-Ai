import { NextRequest, NextResponse } from 'next/server';
import { parseDocument, DocumentParsingError } from '@/lib/ingestion/documentParser';
import { chunkDocument } from '@/lib/ingestion/chunker';
import { storeDocumentAndChunks } from '@/lib/ingestion/chunkStorage';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/documents/parse
 * Multipart form-data or JSON buffer endpoint for document ingestion and text extraction.
 * Optional query parameters:
 * - ?chunk=true (chunks the parsed document)
 * - ?store=true (persists document + chunks to Supabase Postgres ONLY for authenticated users)
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const shouldChunk = req.nextUrl.searchParams.get('chunk') === 'true' || req.nextUrl.searchParams.get('store') === 'true';
    const shouldStore = req.nextUrl.searchParams.get('store') === 'true';
    const subject = req.nextUrl.searchParams.get('subject') || undefined;

    // Check if user is authenticated for database persistence
    let authenticatedUserId: string | null = null;
    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      authenticatedUserId = user?.id ?? null;
    } catch {
      // Unauthenticated guest user
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const formSubject = (formData.get('subject') as string | null) || subject;
      const formStore = (formData.get('store') === 'true' || shouldStore) && !!authenticatedUserId;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided in form data under field "file".', code: 'MISSING_FILE' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const parsedDoc = await parseDocument({
        buffer,
        fileName: file.name,
        mimeType: file.type,
      });

      const chunkResult = (shouldChunk || formStore) ? chunkDocument(parsedDoc) : undefined;
      let storageResult = undefined;

      if (formStore && chunkResult && authenticatedUserId) {
        storageResult = await storeDocumentAndChunks({
          document: parsedDoc,
          chunks: chunkResult.chunks,
          userId: authenticatedUserId,
          subject: formSubject,
        });
      }

      let docSummary = storageResult?.summary;
      if (!docSummary && chunkResult && chunkResult.chunks.length > 0) {
        try {
          const { generateDocumentSummary } = await import('@/lib/ingestion/summarizer');
          const sumRes = await generateDocumentSummary(parsedDoc, chunkResult.chunks);
          docSummary = sumRes.summary;
        } catch {
          /* non-blocking fallback */
        }
      }

      return NextResponse.json({
        success: true,
        document: {
          ...parsedDoc,
          summary: docSummary,
        },
        summary: docSummary,
        isGuest: !authenticatedUserId,
        ...(chunkResult ? { chunking: chunkResult } : {}),
        ...(storageResult ? { storage: storageResult } : {}),
      });
    }

    // Direct binary or JSON payload with base64 data
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { fileName, fileData, mimeType, chunk, store, subject: bodySubject } = body;

      if (!fileName || !fileData) {
        return NextResponse.json(
          { error: 'Invalid JSON payload. Expected "fileName" and "fileData" (base64 string).', code: 'INVALID_PAYLOAD' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(fileData, 'base64');
      const parsedDoc = await parseDocument({
        buffer,
        fileName,
        mimeType,
      });

      const effectiveStore = (store || shouldStore) && !!authenticatedUserId;
      const effectiveChunk = shouldChunk || chunk || effectiveStore;
      const chunkResult = effectiveChunk ? chunkDocument(parsedDoc) : undefined;
      let storageResult = undefined;

      if (effectiveStore && chunkResult && authenticatedUserId) {
        storageResult = await storeDocumentAndChunks({
          document: parsedDoc,
          chunks: chunkResult.chunks,
          userId: authenticatedUserId,
          subject: bodySubject || subject,
        });
      }

      let docSummary = storageResult?.summary;
      if (!docSummary && chunkResult && chunkResult.chunks.length > 0) {
        try {
          const { generateDocumentSummary } = await import('@/lib/ingestion/summarizer');
          const sumRes = await generateDocumentSummary(parsedDoc, chunkResult.chunks);
          docSummary = sumRes.summary;
        } catch {
          /* non-blocking fallback */
        }
      }

      return NextResponse.json({
        success: true,
        document: {
          ...parsedDoc,
          summary: docSummary,
        },
        summary: docSummary,
        isGuest: !authenticatedUserId,
        ...(chunkResult ? { chunking: chunkResult } : {}),
        ...(storageResult ? { storage: storageResult } : {}),
      });
    }

    return NextResponse.json(
      { error: 'Content-Type must be multipart/form-data or application/json.', code: 'INVALID_CONTENT_TYPE' },
      { status: 415 }
    );
  } catch (error: any) {
    if (error instanceof DocumentParsingError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          fileName: error.fileName,
          fileType: error.fileType,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'An unexpected error occurred while parsing the document.',
        code: 'INTERNAL_PARSE_ERROR',
      },
      { status: 500 }
    );
  }
}
