import { NextRequest, NextResponse } from 'next/server';
import { parsePdf, DocumentParsingError } from '@/lib/ingestion/documentParser';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const blob = file as File;

    // Validate MIME type
    if (blob.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Validate size (10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (blob.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds the 10 MB limit' }, { status: 400 });
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await parsePdf(buffer, blob.name, blob.type);

    return NextResponse.json({ text: parsed.extractedText });
  } catch (err) {
    if (err instanceof DocumentParsingError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[parse-pdf]', err);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
