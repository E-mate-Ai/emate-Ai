import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedDocument } from './documentParser';
import type { DocumentChunk } from './chunker';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';
import { generateEmbeddings } from '@/lib/retrieval/embeddings';
import { generateDocumentSummary } from './summarizer';

/**
 * e-Mate AI — Document & Chunk Database Storage Engine
 * Persists parsed documents, semantic chunks, and pgvector embeddings into Supabase Postgres.
 */

export interface StoreDocumentAndChunksOptions {
  document: ParsedDocument;
  chunks: DocumentChunk[];
  userId?: string | null;
  subject?: string | null;
  storagePath?: string | null;
  /** Whether to automatically generate and store 768-dim vector embeddings (default: true) */
  generateEmbeddings?: boolean;
  supabaseClient?: SupabaseClient;
}

export interface StoreDocumentAndChunksResult {
  success: boolean;
  documentId: string;
  summary?: string;
  totalChunksStored: number;
  totalChunksEmbedded: number;
  embeddingProvider?: 'gemini' | 'local_fallback';
  storedChunks: DocumentChunk[];
  error?: string;
}

/**
 * Stores a parsed document and its semantic chunks in Supabase,
 * generating and populating pgvector embeddings.
 */
export async function storeDocumentAndChunks(
  options: StoreDocumentAndChunksOptions
): Promise<StoreDocumentAndChunksResult> {
  const {
    document,
    chunks,
    userId = null,
    subject = null,
    storagePath = null,
    generateEmbeddings: shouldEmbed = true,
  } = options;

  try {
    const supabase = options.supabaseClient || (await createSupabaseServer());

    // 1. Generate executive summary for document-level retrieval
    let documentSummary: string | undefined = undefined;
    try {
      const sumResult = await generateDocumentSummary(document, chunks);
      documentSummary = sumResult.summary;
    } catch {
      // Non-blocking summary fallback
    }

    // 2. Insert parent document row
    const insertPayload: Record<string, any> = {
      user_id: userId,
      file_name: document.fileName,
      file_type: document.fileType,
      mime_type: document.mimeType,
      file_size_bytes: document.fileSizeBytes,
      total_characters: document.totalCharacters,
      total_words: document.totalEstimatedWords,
      total_chunks: chunks.length,
      subject,
      storage_path: storagePath,
    };
    if (documentSummary) {
      insertPayload.summary = documentSummary;
    }

    const { data: docRow, error: docError } = await supabase
      .from('documents')
      .insert(insertPayload)
      .select('id')
      .single();

    if (docError || !docRow) {
      throw new Error(`Failed to insert document metadata: ${docError?.message || 'Unknown database error'}`);
    }

    const documentId = docRow.id as string;

    // 2. Generate vector embeddings for all chunks if requested
    let chunkEmbeddings: number[][] = [];
    let embeddingProvider: 'gemini' | 'local_fallback' | undefined = undefined;

    if (shouldEmbed && chunks.length > 0) {
      const chunkTexts = chunks.map((c) => c.text);
      const embedResult = await generateEmbeddings(chunkTexts);
      chunkEmbeddings = embedResult.embeddings;
      embeddingProvider = embedResult.provider;
    }

    // 3. Prepare chunk rows with documentId linkage and vectors
    const chunkRows = chunks.map((chunk, idx) => ({
      id: `${documentId}_chunk_${chunk.positionIndex || idx + 1}`,
      document_id: documentId,
      user_id: userId,
      source: chunk.source,
      page_or_section: chunk.pageOrSection || null,
      text: chunk.text,
      position_index: chunk.positionIndex || idx + 1,
      word_count: chunk.wordCount || 0,
      character_count: chunk.characterCount || chunk.text.length,
      heading: chunk.metadata?.heading || null,
      heading_level: chunk.metadata?.headingLevel || null,
      page_number: chunk.metadata?.pageNumber || null,
      metadata: {
        ...chunk.metadata,
        parentDocumentId: documentId,
        embeddingProvider: embeddingProvider || null,
      },
      embedding: chunkEmbeddings[idx] || null,
    }));

    // 4. Insert chunk rows in batch
    if (chunkRows.length > 0) {
      const { error: chunksError } = await supabase.from('document_chunks').insert(chunkRows);

      if (chunksError) {
        throw new Error(`Failed to store document chunks: ${chunksError.message}`);
      }
    }

    // 5. Update chunk objects with final database IDs
    const storedChunks: DocumentChunk[] = chunks.map((c, idx) => ({
      ...c,
      id: `${documentId}_chunk_${c.positionIndex || idx + 1}`,
      metadata: {
        ...c.metadata,
        parentDocumentId: documentId,
      },
    }));

    return {
      success: true,
      documentId,
      summary: documentSummary,
      totalChunksStored: chunkRows.length,
      totalChunksEmbedded: chunkEmbeddings.length,
      embeddingProvider,
      storedChunks,
    };
  } catch (err: any) {
    return {
      success: false,
      documentId: '',
      totalChunksStored: 0,
      totalChunksEmbedded: 0,
      storedChunks: [],
      error: err?.message || 'Failed to persist document and chunks to storage.',
    };
  }
}

/**
 * Populates or updates vector embeddings for chunks in a document that lack them.
 */
export async function populateMissingChunkEmbeddings(
  documentId: string,
  supabaseClient?: SupabaseClient
): Promise<{ updatedCount: number; provider: string }> {
  const supabase = supabaseClient || (await createSupabaseServer());

  const { data: chunks, error } = await supabase
    .from('document_chunks')
    .select('id, text')
    .eq('document_id', documentId)
    .is('embedding', null)
    .order('position_index', { ascending: true });

  if (error || !chunks || chunks.length === 0) {
    return { updatedCount: 0, provider: 'none' };
  }

  const texts = chunks.map((c: any) => c.text);
  const { embeddings, provider } = await generateEmbeddings(texts);

  for (let i = 0; i < chunks.length; i++) {
    await supabase
      .from('document_chunks')
      .update({ embedding: embeddings[i] })
      .eq('id', chunks[i].id);
  }

  return { updatedCount: chunks.length, provider };
}

/**
 * Retrieves all stored chunks for a given document ordered by position index.
 */
export async function getStoredChunksByDocumentId(
  documentId: string,
  supabaseClient?: SupabaseClient
): Promise<DocumentChunk[]> {
  const supabase = supabaseClient || (await createSupabaseServer());

  const { data, error } = await supabase
    .from('document_chunks')
    .select('*')
    .eq('document_id', documentId)
    .order('position_index', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    source: row.source,
    pageOrSection: row.page_or_section || undefined,
    text: row.text,
    positionIndex: row.position_index,
    wordCount: row.word_count,
    characterCount: row.character_count,
    metadata: {
      fileName: row.source,
      fileType: row.metadata?.fileType || 'other',
      heading: row.heading || undefined,
      headingLevel: row.heading_level || undefined,
      pageNumber: row.page_number || undefined,
      totalDocumentChunks: row.metadata?.totalDocumentChunks || 1,
      parentDocumentId: row.document_id,
    },
  }));
}
