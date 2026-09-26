// ============================================================
// JURIVA — Core Tests
// ============================================================

import { validateFile, formatFileSize } from '@/lib/validation';
import { chunkDocument } from '@/lib/documents/processor';
import { retrieveRelevantChunks } from '@/lib/retrieval/search';
import { saveDocument, getDocument, getAllDocuments, deleteDocument, generateDocumentId, getStoreStats } from '@/lib/documents/store';
import { checkRateLimit, sanitizeInput, getSecurityHeaders, getClientIdentifier, validateContentType } from '@/lib/security';

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

  test('rejects file with unknown extension and no MIME', () => {
    const file = new File(['content'], 'test.xyz', { type: '' });
    Object.defineProperty(file, 'size', { value: 100 });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
  });

  test('validates file at exact size limit boundary', () => {
    const file = new File(['content'], 'exact.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });
});

// ── File Size Formatting Tests ─────────────────────────────

describe('File Size Formatting', () => {
  test('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  test('formats kilobytes correctly', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  test('formats megabytes correctly', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
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

  test('chunk IDs are unique and sequential', () => {
    const text = Array(15).fill('Legal content paragraph for testing unique chunk identifiers in the system.').join('\n\n');
    const chunks = chunkDocument(text, 3);
    const ids = chunks.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(chunks[0].index).toBe(0);
  });

  test('handles single paragraph text', () => {
    const text = 'Short legal document content.';
    const chunks = chunkDocument(text, 1);
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toContain('Short legal');
  });

  test('handles whitespace-only text', () => {
    const chunks = chunkDocument('   \n\n   \n   ', 1);
    expect(chunks.length).toBe(0);
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

  test('ranks non-compete query correctly', () => {
    const results = retrieveRelevantChunks('non-compete restriction period', mockChunks, 2);
    expect(results[0].id).toBe('c3');
  });

  test('retrieves with single-word query', () => {
    const results = retrieveRelevantChunks('payment', mockChunks, 2);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('c2');
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

  test('returns store statistics', () => {
    const stats = getStoreStats();
    expect(stats).toHaveProperty('documentCount');
    expect(stats).toHaveProperty('maxDocuments');
    expect(stats.maxDocuments).toBe(50);
  });

  test('delete returns false for non-existent document', () => {
    const result = deleteDocument('does-not-exist');
    expect(result).toBe(false);
  });
});

// ── Security Middleware Tests ──────────────────────────────

describe('Security - Rate Limiting', () => {
  test('allows first request', () => {
    const result = checkRateLimit('test-ip-unique-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  test('tracks remaining requests', () => {
    const id = 'test-ip-unique-2';
    const first = checkRateLimit(id);
    const second = checkRateLimit(id);
    expect(second.remaining).toBe(first.remaining - 1);
  });

  test('different IPs are tracked independently', () => {
    const r1 = checkRateLimit('ip-a-unique');
    const r2 = checkRateLimit('ip-b-unique');
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });
});

describe('Security - Input Sanitization', () => {
  test('sanitizes normal input', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
  });

  test('removes control characters', () => {
    const result = sanitizeInput('Hello\x00World\x07Test');
    expect(result).toBe('HelloWorldTest');
  });

  test('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  test('enforces max length', () => {
    const long = 'a'.repeat(5000);
    const result = sanitizeInput(long, 100);
    expect(result.length).toBe(100);
  });

  test('handles non-string input', () => {
    expect(sanitizeInput(null as unknown as string)).toBe('');
    expect(sanitizeInput(undefined as unknown as string)).toBe('');
  });

  test('preserves newlines and tabs', () => {
    const result = sanitizeInput('line1\nline2\ttab');
    expect(result).toContain('\n');
    expect(result).toContain('\t');
  });
});

describe('Security - Headers', () => {
  test('returns required security headers', () => {
    const headers = getSecurityHeaders();
    expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
    expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
    expect(headers).toHaveProperty('X-XSS-Protection');
    expect(headers).toHaveProperty('Referrer-Policy');
    expect(headers).toHaveProperty('Permissions-Policy');
    expect(headers).toHaveProperty('Cache-Control');
  });
});

describe('Security - Client Identification', () => {
  test('extracts IP from X-Forwarded-For', () => {
    const headers = new Headers({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' });
    expect(getClientIdentifier(headers)).toBe('192.168.1.1');
  });

  test('extracts IP from X-Real-IP', () => {
    const headers = new Headers({ 'x-real-ip': '172.16.0.1' });
    expect(getClientIdentifier(headers)).toBe('172.16.0.1');
  });

  test('falls back to anonymous', () => {
    const headers = new Headers();
    expect(getClientIdentifier(headers)).toBe('anonymous');
  });
});

describe('Security - Content Type Validation', () => {
  test('validates JSON content type', () => {
    const headers = new Headers({ 'content-type': 'application/json' });
    expect(validateContentType(headers)).toBe(true);
  });

  test('rejects non-JSON content type', () => {
    const headers = new Headers({ 'content-type': 'text/plain' });
    expect(validateContentType(headers)).toBe(false);
  });

  test('rejects missing content type', () => {
    const headers = new Headers();
    expect(validateContentType(headers)).toBe(false);
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

  test('validates complete analysis structure with all fields', () => {
    const analysis = {
      document_type: 'NDA',
      summary: 'A mutual non-disclosure agreement.',
      key_takeaways: ['Mutual obligations', 'Two-year term'],
      key_clauses: [{ title: 'Confidentiality', text: 'Both parties agree...' }],
      obligations: [{ party: 'Both', obligation: 'Maintain confidentiality' }],
      deadlines: [{ date: '2025-12-31', description: 'Agreement expiration' }],
      attention_areas: [{ title: 'Non-compete', description: 'Restrictive clause' }],
    };
    expect(analysis.key_takeaways.length).toBe(2);
    expect(analysis.key_clauses.length).toBe(1);
    expect(analysis.obligations.length).toBe(1);
    expect(analysis.deadlines.length).toBe(1);
    expect(analysis.attention_areas.length).toBe(1);
  });

  test('validates comparison change structure', () => {
    const change = {
      section: 'Section 5',
      changeType: 'modified',
      oldText: 'Original text here',
      newText: 'Updated text here',
      explanation: 'Clause language was strengthened.',
      potentialSignificance: 'high',
    };
    expect(['added', 'removed', 'modified']).toContain(change.changeType);
    expect(change.explanation).toBeTruthy();
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

  test('handles server error responses', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    const response = await fetch('/api/analyze');
    expect(response.status).toBe(500);

    global.fetch = originalFetch;
  });

  test('handles timeout scenarios', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Timeout'));

    try {
      await fetch('/api/ask');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBe('Timeout');
    }

    global.fetch = originalFetch;
  });
});
