// ============================================================
// JURIVA — Lightweight Retrieval (TF-IDF based)
// ============================================================
// Uses term frequency scoring for chunk retrieval without
// external embedding models or vector databases.

import { DocumentChunk } from '@/types';

/**
 * Tokenize text into normalized terms.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

/**
 * Compute term frequency for a list of tokens.
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize
  const max = Math.max(...tf.values(), 1);
  for (const [term, count] of tf) {
    tf.set(term, count / max);
  }
  return tf;
}

/**
 * Compute inverse document frequency across chunks.
 */
function inverseDocFrequency(
  chunks: DocumentChunk[],
): Map<string, number> {
  const df = new Map<string, number>();
  const N = chunks.length;

  for (const chunk of chunks) {
    const uniqueTokens = new Set(tokenize(chunk.text));
    for (const token of uniqueTokens) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
  }

  return idf;
}

/**
 * Score a chunk against a query using TF-IDF similarity.
 */
function scoreChunk(
  chunkTokens: string[],
  queryTokens: string[],
  idf: Map<string, number>,
): number {
  const chunkTf = termFrequency(chunkTokens);
  let score = 0;

  for (const qt of queryTokens) {
    const tf = chunkTf.get(qt) || 0;
    const idfScore = idf.get(qt) || 1;
    score += tf * idfScore;
  }

  return score;
}

/**
 * Retrieve the most relevant chunks for a given query.
 */
export function retrieveRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  topK: number = 10,
): DocumentChunk[] {
  if (chunks.length === 0) return [];
  if (chunks.length <= topK) return chunks;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return chunks.slice(0, topK);

  const idf = inverseDocFrequency(chunks);

  const scored = chunks.map(chunk => ({
    chunk,
    score: scoreChunk(tokenize(chunk.text), queryTokens, idf),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(s => s.chunk);
}
