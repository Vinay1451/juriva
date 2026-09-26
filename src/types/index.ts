// ============================================================
// JURIVA — Core Type Definitions
// ============================================================

/** Supported document file types */
export type SupportedFileType = 'pdf' | 'docx' | 'txt';

/** Document processing states */
export type ProcessingState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'analyzing'
  | 'complete'
  | 'error';

/** Source reference linking AI output to document evidence */
export interface SourceReference {
  page?: number;
  section?: string;
  clauseNumber?: string;
  originalText: string;
  chunkId?: string;
}

/** A text chunk with metadata for retrieval */
export interface DocumentChunk {
  id: string;
  text: string;
  page?: number;
  section?: string;
  clauseNumber?: string;
  index: number;
}

/** Uploaded document with extracted content */
export interface UploadedDocument {
  id: string;
  name: string;
  type: SupportedFileType;
  size: number;
  uploadedAt: string;
  chunks: DocumentChunk[];
  fullText: string;
  pageCount?: number;
}

/** Key clause extracted from a document */
export interface KeyClause {
  title: string;
  clauseNumber?: string;
  page?: number;
  originalText: string;
  plainLanguage: string;
  attentionNote?: string;
  relatedObligations?: string[];
  relatedDates?: string[];
  relatedSections?: string[];
  source: SourceReference;
}

/** Obligation extracted from a document */
export interface Obligation {
  party: string;
  obligation: string;
  deadline?: string;
  trigger?: string;
  consequence?: string;
  source: SourceReference;
}

/** Date or deadline extracted from a document */
export interface ExtractedDate {
  date: string;
  description: string;
  type: 'deadline' | 'notice_period' | 'payment' | 'renewal' | 'expiration' | 'response_window' | 'other';
  source: SourceReference;
}

/** Attention area — a provision that may deserve closer review */
export interface AttentionArea {
  title: string;
  category: string;
  description: string;
  significance: string;
  source: SourceReference;
}

/** Full document analysis result from AI */
export interface DocumentAnalysis {
  documentId: string;
  documentType: string;
  summary: string;
  keyTakeaways: string[];
  keyClauses: KeyClause[];
  obligations: Obligation[];
  deadlines: ExtractedDate[];
  attentionAreas: AttentionArea[];
  sources: SourceReference[];
  analyzedAt: string;
}

/** Q&A answer with source grounding */
export interface QAAnswer {
  answer: string;
  explanation: string;
  isSupported: boolean;
  sources: SourceReference[];
  suggestedFollowUp?: string;
}

/** A single change between two document versions */
export interface ComparisonChange {
  section: string;
  clauseTitle?: string;
  changeType: 'added' | 'removed' | 'modified';
  oldText?: string;
  newText?: string;
  explanation: string;
  potentialSignificance: string;
  source: SourceReference;
}

/** Full comparison result between two documents */
export interface ComparisonResult {
  documentA: { id: string; name: string };
  documentB: { id: string; name: string };
  totalSections: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  changes: ComparisonChange[];
  summary: string;
  comparedAt: string;
}

/** Lawyer preparation output */
export interface PreparationOutput {
  documentId: string;
  keyFacts: Array<{
    fact: string;
    source: SourceReference;
  }>;
  relevantClauses: Array<{
    clause: string;
    section: string;
    source: SourceReference;
  }>;
  importantObligations: Obligation[];
  importantDates: ExtractedDate[];
  informationToCollect: string[];
  questionsToDiscuss: string[];
  topicsRequiringClarification: string[];
  generatedAt: string;
}

/** AI service configuration */
export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/** API error response */
export interface APIError {
  message: string;
  code: string;
  details?: string;
}

/** Validation result for uploaded files */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: SupportedFileType;
}
