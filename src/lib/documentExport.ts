export interface DocumentExportOptions {
  title: string;
  content: string;
  format: 'pptx' | 'docx' | 'markdown';
}

/**
 * Exports markdown content into a true Microsoft PowerPoint (.pptx) file via server generation.
 */
export async function exportToPptx(title: string, markdown: string): Promise<Blob> {
  const res = await fetch('/api/export-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content: markdown, format: 'pptx' }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Presentation export failed (${res.status})`);
  }

  return await res.blob();
}

/**
 * Exports markdown content into a true Microsoft Word (.docx) file via server generation.
 */
export async function exportToDocx(title: string, markdown: string): Promise<Blob> {
  const res = await fetch('/api/export-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content: markdown, format: 'docx' }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Document export failed (${res.status})`);
  }

  return await res.blob();
}

/**
 * Triggers a client-side download for a blob or text content.
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
