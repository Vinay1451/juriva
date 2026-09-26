// ============================================================
// JURIVA — Document Processing Pipeline
// ============================================================

import { DocumentChunk, SupportedFileType } from '@/types';

/**
 * Extract text from a PDF buffer using pdf-parse.
 */
async function extractPDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return { text: data.text, pages: data.numpages };
}

/**
 * Extract text from a DOCX buffer using mammoth.
 */
async function extractDOCX(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  // DOCX doesn't have native page info; estimate from content
  const estimatedPages = Math.max(1, Math.ceil(result.value.length / 3000));
  return { text: result.value, pages: estimatedPages };
}

/**
 * Extract text from a plain text buffer.
 */
function extractTXT(buffer: Buffer): { text: string; pages: number } {
  const text = buffer.toString('utf-8');
  const estimatedPages = Math.max(1, Math.ceil(text.length / 3000));
  return { text, pages: estimatedPages };
}

/**
 * Extract text from an uploaded file buffer based on file type.
 */
export async function extractText(
  buffer: Buffer,
  fileType: SupportedFileType,
): Promise<{ text: string; pages: number }> {
  switch (fileType) {
    case 'pdf':
      return extractPDF(buffer);
    case 'docx':
      return extractDOCX(buffer);
    case 'txt':
      return extractTXT(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Chunk document text with metadata for retrieval.
 *
 * Strategy: Split by sections/paragraphs, then merge small chunks,
 * preserving page boundaries when possible.
 */
export function chunkDocument(
  text: string,
  pageCount: number,
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Split by double newlines (paragraphs) or section-like patterns
  const sectionPattern = /\n{2,}|(?=(?:ARTICLE|SECTION|CLAUSE|PART)\s+\d)/gi;
  const rawSegments = text.split(sectionPattern).filter(s => s.trim().length > 0);

  // Estimate characters per page
  const charsPerPage = text.length / Math.max(pageCount, 1);

  // Target chunk size: ~800-1200 chars for good retrieval granularity
  const TARGET_CHUNK_SIZE = 1000;
  const MAX_CHUNK_SIZE = 1500;

  let currentChunk = '';
  let currentCharOffset = 0;
  let chunkIndex = 0;

  for (const segment of rawSegments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      // Flush current chunk
      const page = Math.min(pageCount, Math.max(1, Math.ceil(currentCharOffset / charsPerPage)));
      const sectionMatch = currentChunk.match(/(?:ARTICLE|SECTION|CLAUSE|PART)\s+[\d.]+/i);

      chunks.push({
        id: `chunk-${chunkIndex}`,
        text: currentChunk.trim(),
        page,
        section: sectionMatch?.[0] || undefined,
        index: chunkIndex,
      });
      chunkIndex++;
      currentCharOffset += currentChunk.length;
      currentChunk = '';
    }

    currentChunk += (currentChunk ? '\n\n' : '') + trimmed;

    // Flush if at target size
    if (currentChunk.length >= TARGET_CHUNK_SIZE) {
      const page = Math.min(pageCount, Math.max(1, Math.ceil(currentCharOffset / charsPerPage)));
      const sectionMatch = currentChunk.match(/(?:ARTICLE|SECTION|CLAUSE|PART)\s+[\d.]+/i);

      chunks.push({
        id: `chunk-${chunkIndex}`,
        text: currentChunk.trim(),
        page,
        section: sectionMatch?.[0] || undefined,
        index: chunkIndex,
      });
      chunkIndex++;
      currentCharOffset += currentChunk.length;
      currentChunk = '';
    }
  }

  // Flush remaining
  if (currentChunk.trim()) {
    const page = Math.min(pageCount, Math.max(1, Math.ceil(currentCharOffset / charsPerPage)));
    const sectionMatch = currentChunk.match(/(?:ARTICLE|SECTION|CLAUSE|PART)\s+[\d.]+/i);

    chunks.push({
      id: `chunk-${chunkIndex}`,
      text: currentChunk.trim(),
      page,
      section: sectionMatch?.[0] || undefined,
      index: chunkIndex,
    });
  }

  return chunks;
}
