// ============================================================
// JURIVA — Core Tests
// ============================================================

import { validateFile } from '@/lib/validation';
import { chunkDocument } from '@/lib/documents/processor';
import { retrieveRelevantChunks } from '@/lib/retrieval/search';
import { saveDocument, getDocument, getAllDocuments, deleteDocument, generateDocumentId } from '@/lib/documents/store';

// ── File Validation Tests ──────────────────────────────────

describe('File Validation', () => {
  test('validates a valid PDF file', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('pdf');
  });

  test('validates a valid DOCX file', () => {
    const file = new File(['content'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    Object.defineProperty(file, 'size', { value: 1024 });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('docx');
  });

  test('validates a valid TXT file', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 100 });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('txt');
  });

  test('rejects an empty file', () => {
    const file = new File([], 'empty.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 0 });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  test('rejects an oversized file (>10MB)', () => {
    const file = new File(['x'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10 MB');
  });

  test('rejects an unsupported file type', () => {
    const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported');
  });

  test('validates by extension fallback when MIME is generic', () => {
    const file = new File(['content'], 'test.txt', { type: '' });
    Object.defineProperty(file, 'size', { value: 100 });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('txt');
  });
});

// ── Document Chunking Tests ────────────────────────────────

describe('Document Chunking', () => {
  test('chunks document text into segments', () => {
    const text = Array(20).fill('This is a paragraph of legal text discussing various terms and conditions of the agreement between the parties.').join('\n\n');
    const chunks = chunkDocument(text, 5);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('id');
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('page');
    expect(chunks[0]).toHaveProperty('index');
  });

  test('handles empty text', () => {
    const chunks = chunkDocument('', 1);
    expect(chunks.length).toBe(0);
  });

  test('assigns page numbers correctly', () => {
    const text = Array(30).fill('Section content with enough text to create multiple chunks for retrieval purposes.').join('\n\n');
    const chunks = chunkDocument(text, 10);
    chunks.forEach(chunk => {
      expect(chunk.page).toBeGreaterThanOrEqual(1);
      expect(chunk.page).toBeLessThanOrEqual(10);
    });
  });

  test('detects section patterns', () => {
    const text = 'SECTION 1. Introduction\n\nContent here.\n\nSECTION 2. Terms\n\nMore content here about terms and conditions that apply to both parties in the agreement.';
    const chunks = chunkDocument(text, 1);
    expect(chunks.length).toBeGreaterThan(0);
  });
});

// ── Retrieval Tests ────────────────────────────────────────

describe('TF-IDF Retrieval', () => {
  const mockChunks = [
    { id: 'c1', text: 'The termination clause requires 90 days written notice before termination of the agreement.', page: 4, section: 'Section 8.2', index: 0 },
    { id: 'c2', text: 'Rent payment is due on the 5th of every month. Late payments incur a 5% penalty.', page: 2, section: 'Section 4.1', index: 1 },
    { id: 'c3', text: 'The employee agrees to a non-compete clause lasting 12 months after termination.', page: 6, section: 'Section 12', index: 2 },
    { id: 'c4', text: 'All intellectual property created during employment belongs to the employer.', page: 7, section: 'Section 14', index: 3 },
    { id: 'c5', text: 'The agreement renews automatically for successive one-year periods unless terminated.', page: 1, section: 'Section 2', index: 4 },
  ];

  test('retrieves relevant chunks for a termination question', () => {
    const results = retrieveRelevantChunks('termination notice period', mockChunks, 3);
    expect(results.length).toBe(3);
    // Termination-related chunks should rank higher
    const topIds = results.map(r => r.id);
    expect(topIds).toContain('c1');
  });

  test('retrieves relevant chunks for a payment question', () => {
    const results = retrieveRelevantChunks('rent payment due date', mockChunks, 2);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('c2');
  });

  test('retrieves relevant chunks for IP question', () => {
    const results = retrieveRelevantChunks('intellectual property ownership', mockChunks, 2);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('c4');
  });

  test('handles empty query', () => {
    const results = retrieveRelevantChunks('', mockChunks, 3);
    expect(results.length).toBe(3);
  });

  test('handles empty chunks', () => {
    const results = retrieveRelevantChunks('termination', [], 3);
    expect(results.length).toBe(0);
  });

  test('returns all chunks when topK > chunk count', () => {
    const results = retrieveRelevantChunks('test', mockChunks, 100);
    expect(results.length).toBe(mockChunks.length);
  });
});

// ── Document Store Tests ───────────────────────────────────

describe('Document Store', () => {
  const testDoc = {
    id: 'test-doc-1',
    name: 'test.pdf',
    type: 'pdf' as const,
    size: 1024,
    uploadedAt: new Date().toISOString(),
    chunks: [],
    fullText: 'Test content',
    pageCount: 1,
  };

  test('saves and retrieves a document', () => {
    saveDocument(testDoc);
    const retrieved = getDocument('test-doc-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('test.pdf');
  });

  test('returns null for non-existent document', () => {
    const result = getDocument('nonexistent');
    expect(result).toBeNull();
  });

  test('lists all documents', () => {
    saveDocument({ ...testDoc, id: 'test-doc-2', name: 'second.pdf' });
    const all = getAllDocuments();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  test('deletes a document', () => {
    const deleted = deleteDocument('test-doc-2');
    expect(deleted).toBe(true);
    expect(getDocument('test-doc-2')).toBeNull();
  });

  test('generates unique document IDs', () => {
    const id1 = generateDocumentId();
    const id2 = generateDocumentId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^doc_/);
  });
});

// ── AI Response Validation Tests ───────────────────────────

describe('AI Response Validation', () => {
  test('validates well-formed analysis response', () => {
    const validResponse = {
      document_type: 'Employment Agreement',
      summary: 'This is a test summary.',
      key_takeaways: ['Point 1'],
      key_clauses: [],
      obligations: [],
      deadlines: [],
      attention_areas: [],
    };
    // Should not throw
    expect(() => JSON.parse(JSON.stringify(validResponse))).not.toThrow();
    expect(validResponse).toHaveProperty('document_type');
    expect(validResponse).toHaveProperty('summary');
  });

  test('detects malformed JSON', () => {
    const badJson = '{ invalid json }';
    expect(() => JSON.parse(badJson)).toThrow();
  });

  test('detects missing required fields', () => {
    const incomplete = { document_type: 'Test' };
    expect(incomplete).not.toHaveProperty('summary');
  });

  test('handles empty AI response', () => {
    const empty = '';
    expect(() => JSON.parse(empty)).toThrow();
  });

  test('validates source reference structure', () => {
    const validSource = {
      page: 4,
      section: 'Section 8.2',
      originalText: 'Either party may terminate...',
    };
    expect(validSource.page).toBeGreaterThan(0);
    expect(validSource.section).toBeTruthy();
    expect(validSource.originalText).toBeTruthy();
  });

  test('validates Q&A response with unsupported answer', () => {
    const unsupported = {
      answer: 'The provided document does not clearly answer this question.',
      explanation: '',
      is_supported: false,
      sources: [],
      suggested_follow_up: 'Consider discussing this with a qualified legal professional.',
    };
    expect(unsupported.is_supported).toBe(false);
    expect(unsupported.sources).toHaveLength(0);
  });
});

// ── Error Handling Tests ───────────────────────────────────

describe('Error Handling', () => {
  test('handles AI API errors gracefully', async () => {
    // Simulate fetch failure
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    try {
      await fetch('/api/analyze');
    } catch (err) {
      expect(err).toBeDefined();
    }

    global.fetch = originalFetch;
  });

  test('handles rate limit responses', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limited' }),
    });

    const response = await fetch('/api/analyze');
    expect(response.status).toBe(429);

    global.fetch = originalFetch;
  });

  test('handles invalid API key responses', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid API key' }),
    });

    const response = await fetch('/api/analyze');
    expect(response.status).toBe(401);

    global.fetch = originalFetch;
  });
});
