// ============================================================
// JURIVA — In-Memory Document Store
// ============================================================
// Temporary storage for hackathon MVP. Documents are stored in
// server memory and cleared on restart. No persistence of user
// documents beyond the session.

import { UploadedDocument, DocumentAnalysis, PreparationOutput } from '@/types';

interface StoredDocument {
  document: UploadedDocument;
  analysis?: DocumentAnalysis;
  preparation?: PreparationOutput;
}

const store = new Map<string, StoredDocument>();

export function saveDocument(doc: UploadedDocument): void {
  store.set(doc.id, { document: doc });
}

export function getDocument(id: string): UploadedDocument | null {
  return store.get(id)?.document || null;
}

export function getAllDocuments(): UploadedDocument[] {
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
 * Generate a unique document ID.
 */
export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
