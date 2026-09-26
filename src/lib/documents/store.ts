// ============================================================
// JURIVA — In-Memory Document Store
// ============================================================
// Temporary storage for hackathon MVP. Documents are stored in
// server memory and cleared on restart. No persistence of user
// documents beyond the session.
// Includes automatic expiry for memory efficiency.

import { UploadedDocument, DocumentAnalysis, PreparationOutput } from '@/types';

interface StoredDocument {
  document: UploadedDocument;
  analysis?: DocumentAnalysis;
  preparation?: PreparationOutput;
  createdAt: number;
}

const store = new Map<string, StoredDocument>();

/** Maximum number of documents in memory to prevent memory exhaustion. */
const MAX_DOCUMENTS = 50;

/** Document TTL: 60 minutes in milliseconds. */
const DOCUMENT_TTL_MS = 60 * 60 * 1000;

/**
 * Evict expired documents and enforce max document limit.
 * Called automatically before save operations.
 */
function evictStaleDocuments(): void {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > DOCUMENT_TTL_MS) {
      store.delete(id);
    }
  }
  // If still over limit, remove oldest entries
  if (store.size >= MAX_DOCUMENTS) {
    const sorted = [...store.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toRemove = sorted.slice(0, store.size - MAX_DOCUMENTS + 1);
    for (const [id] of toRemove) {
      store.delete(id);
    }
  }
}

export function saveDocument(doc: UploadedDocument): void {
  evictStaleDocuments();
  store.set(doc.id, { document: doc, createdAt: Date.now() });
}

export function getDocument(id: string): UploadedDocument | null {
  const entry = store.get(id);
  if (!entry) return null;
  // Check TTL
  if (Date.now() - entry.createdAt > DOCUMENT_TTL_MS) {
    store.delete(id);
    return null;
  }
  return entry.document;
}

export function getAllDocuments(): UploadedDocument[] {
  evictStaleDocuments();
  return Array.from(store.values()).map(s => s.document);
}

export function deleteDocument(id: string): boolean {
  return store.delete(id);
}

export function saveAnalysis(documentId: string, analysis: DocumentAnalysis): void {
  const entry = store.get(documentId);
  if (entry) {
    entry.analysis = analysis;
  }
}

export function getAnalysis(documentId: string): DocumentAnalysis | null {
  return store.get(documentId)?.analysis || null;
}

export function savePreparation(documentId: string, preparation: PreparationOutput): void {
  const entry = store.get(documentId);
  if (entry) {
    entry.preparation = preparation;
  }
}

export function getPreparation(documentId: string): PreparationOutput | null {
  return store.get(documentId)?.preparation || null;
}

/**
 * Generate a unique document ID using timestamp and random suffix.
 */
export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current store statistics for monitoring.
 */
export function getStoreStats(): { documentCount: number; maxDocuments: number } {
  return { documentCount: store.size, maxDocuments: MAX_DOCUMENTS };
}
