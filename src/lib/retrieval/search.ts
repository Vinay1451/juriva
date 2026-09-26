// ============================================================
// JURIVA — Lightweight Retrieval (TF-IDF based)
// ============================================================
// Uses term frequency scoring for chunk retrieval without
// external embedding models or vector databases.
// Optimized with IDF caching and early termination.

import { DocumentChunk } from '@/types';

/** Stop words to filter out for more accurate retrieval. */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
  'can', 'has', 'her', 'was', 'one', 'our', 'out', 'its',
  'his', 'had', 'how', 'may', 'who', 'did', 'get', 'let',
  'say', 'she', 'too', 'use', 'than', 'them', 'then',
  'this', 'that', 'with', 'have', 'from', 'they', 'been',
  'will', 'each', 'make', 'like', 'into', 'just', 'over',
  'such', 'take', 'also', 'more', 'some', 'what', 'when',
  'which', 'their', 'shall', 'does', 'about', 'would',
  'there', 'these', 'those', 'could', 'other', 'after',
  'should', 'being', 'where', 'between', 'under',
]);

/** IDF cache to avoid recomputation for the same chunk set. */
const idfCache = new WeakMap<DocumentChunk[], Map<string, number>>();
const tokenCache = new WeakMap<DocumentChunk, string[]>();

/**
 * Tokenize text into normalized terms with stop word filtering.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Get cached tokens for a chunk.
 */
function getChunkTokens(chunk: DocumentChunk): string[] {
  let tokens = tokenCache.get(chunk);
  if (!tokens) {
    tokens = tokenize(chunk.text);
    tokenCache.set(chunk, tokens);
  }
  return tokens;
}

/**
 * Compute term frequency for a list of tokens (normalized by max frequency).
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize by maximum frequency
  const max = Math.max(...tf.values(), 1);
  for (const [term, count] of tf) {
    tf.set(term, count / max);
  }
  return tf;
}

/**
 * Compute inverse document frequency across chunks with caching.
 */
function inverseDocFrequency(chunks: DocumentChunk[]): Map<string, number> {
  // Return cached IDF if available
  const cached = idfCache.get(chunks);
  if (cached) return cached;

  const df = new Map<string, number>();
  const N = chunks.length;

  for (const chunk of chunks) {
    const uniqueTokens = new Set(getChunkTokens(chunk));
    for (const token of uniqueTokens) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
  }

  // Cache the result
  idfCache.set(chunks, idf);
  return idf;
}

/**
 * Score a chunk against a query using TF-IDF cosine similarity.
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
 * Uses TF-IDF scoring with stop word filtering, token caching,
 * and IDF memoization for optimal performance.
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
    score: scoreChunk(getChunkTokens(chunk), queryTokens, idf),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(s => s.chunk);
}
