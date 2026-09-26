// ============================================================
// JURIVA — AI Service Abstraction
// ============================================================

import {
  DocumentAnalysis,
  QAAnswer,
  ComparisonResult,
  PreparationOutput,
  DocumentChunk,
  SourceReference,
  KeyClause,
  Obligation,
  ExtractedDate,
  AttentionArea,
} from '@/types';

/**
 * Get AI configuration from environment variables (server-side only).
 */
function getAIConfig() {
  const groqKey = process.env.GROQ_API_KEY;
  const apiKey = groqKey || process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || (groqKey ? 'https://api.groq.com/openai/v1' : 'https://generativelanguage.googleapis.com/v1beta');
  const model = process.env.AI_MODEL || (groqKey ? 'openai/gpt-oss-120b' : 'gemini-2.0-flash');

  if (!apiKey) {
    throw new Error('Neither GROQ_API_KEY nor AI_API_KEY environment variable is configured.');
  }

  return { apiKey, baseUrl, model };
}

/**
 * Call the AI model with a prompt and get a structured response.
 * Supports both OpenAI-compatible and Google Gemini APIs.
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const { apiKey, baseUrl, model } = getAIConfig();

  const isGemini = baseUrl.includes('generativelanguage.googleapis.com');

  if (isGemini) {
    const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 429) throw new Error('RATE_LIMITED');
      if (response.status === 401 || response.status === 403) throw new Error('INVALID_API_KEY');
      throw new Error(`AI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty AI response');
    return text;

  } else {
    // OpenAI-compatible API
    const url = `${baseUrl}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 429) throw new Error('RATE_LIMITED');
      if (response.status === 401 || response.status === 403) throw new Error('INVALID_API_KEY');
      throw new Error(`AI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty AI response');
    return text;
  }
}

/**
 * Safely parse AI JSON response with validation.
 */
function parseAIResponse<T>(raw: string, requiredFields: string[]): T {
  let parsed: T;
  try {
    // Handle potential markdown code blocks in response
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI response was not valid JSON. Please try again.');
  }

  for (const field of requiredFields) {
    if (!(field in (parsed as Record<string, unknown>))) {
      throw new Error(`AI response missing required field: ${field}`);
    }
  }

  return parsed;
}

// ── System Prompts ──────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are JURIVA, an AI legal document analysis assistant.

CRITICAL RULES:
1. Only use information from the provided document. Never invent clauses, page numbers, obligations, or deadlines.
2. If information is not present in the document, explicitly state it is not found.
3. Never provide legal advice or conclusions about legality/validity.
4. Use cautious language: "This clause may deserve careful review", "This section indicates", "According to the document".
5. Every claim must reference the source section/page from the document.
6. Distinguish between document facts, AI explanations, and attention areas.

Respond with a JSON object matching this exact schema:
{
  "document_type": "string - type of legal document (e.g., Employment Agreement, Lease, NDA)",
  "summary": "string - plain-language summary of the document (3-5 sentences)",
  "key_takeaways": ["string array - 3-7 most important points"],
  "key_clauses": [
    {
      "title": "string - clause name",
      "clauseNumber": "string or null - section number if available",
      "page": "number or null - page number if available",
      "originalText": "string - exact text from document",
      "plainLanguage": "string - plain-language explanation",
      "attentionNote": "string or null - why this deserves attention",
      "relatedObligations": ["string array"],
      "relatedDates": ["string array"],
      "relatedSections": ["string array"]
    }
  ],
  "obligations": [
    {
      "party": "string - who is obligated",
      "obligation": "string - what they must do",
      "deadline": "string or null",
      "trigger": "string or null",
      "consequence": "string or null",
      "source_section": "string",
      "source_page": "number or null",
      "source_text": "string - supporting text from document"
    }
  ],
  "deadlines": [
    {
      "date": "string - the date or time period",
      "description": "string - what this deadline is for",
      "type": "string - one of: deadline, notice_period, payment, renewal, expiration, response_window, other",
      "source_section": "string",
      "source_page": "number or null",
      "source_text": "string"
    }
  ],
  "attention_areas": [
    {
      "title": "string - provision name",
      "category": "string - e.g., Automatic Renewal, Termination, Liability, Non-Compete, etc.",
      "description": "string - what this provision states",
      "significance": "string - why this may deserve careful review",
      "source_section": "string",
      "source_page": "number or null",
      "source_text": "string"
    }
  ]
}`;

const QA_SYSTEM_PROMPT = `You are JURIVA, an AI legal document Q&A assistant.

CRITICAL RULES:
1. Answer ONLY based on the provided document context. Never guess or assume.
2. If the answer is not in the document, say: "The provided document does not clearly answer this question."
3. Always cite the specific section and page number where the answer was found.
4. Never provide legal advice. Use language like "The document states..." or "According to Section X..."
5. Include the relevant original text as source evidence.

Respond with a JSON object:
{
  "answer": "string - direct answer to the question",
  "explanation": "string - brief explanation with context",
  "is_supported": "boolean - true if answer is found in document, false otherwise",
  "sources": [
    {
      "section": "string",
      "page": "number or null",
      "original_text": "string - exact text supporting the answer"
    }
  ],
  "suggested_follow_up": "string or null - suggestion to discuss with a legal professional if relevant"
}`;

const COMPARISON_SYSTEM_PROMPT = `You are JURIVA, an AI legal document comparison assistant.

CRITICAL RULES:
1. Compare the two documents semantically, not just line-by-line.
2. Identify meaningful changes in clauses, obligations, deadlines, and terms.
3. Never state whether changes are legally better or worse.
4. Use language like "The updated version requires..." or "This change may affect..."
5. Reference specific sections in both documents.

Respond with a JSON object:
{
  "total_sections_compared": "number",
  "summary": "string - overview of key changes",
  "changes": [
    {
      "section": "string - section identifier",
      "clause_title": "string or null",
      "change_type": "string - one of: added, removed, modified",
      "old_text": "string or null - text from Document A",
      "new_text": "string or null - text from Document B",
      "explanation": "string - what changed in plain language",
      "potential_significance": "string - why this change may matter",
      "source_section": "string",
      "source_page_a": "number or null",
      "source_page_b": "number or null"
    }
  ]
}`;

const PREPARATION_SYSTEM_PROMPT = `You are JURIVA, helping a user prepare information for a meeting with a legal professional.

CRITICAL RULES:
1. Only reference facts found in the provided document.
2. Generate practical questions the user may want to discuss with a lawyer.
3. Suggest information/documents the user might want to collect.
4. Never provide legal advice or predict outcomes.
5. Frame everything as preparation support, not legal guidance.

Respond with a JSON object:
{
  "key_facts": [
    {
      "fact": "string",
      "source_section": "string",
      "source_page": "number or null",
      "source_text": "string"
    }
  ],
  "relevant_clauses": [
    {
      "clause": "string - clause description",
      "section": "string",
      "source_section": "string",
      "source_page": "number or null",
      "source_text": "string"
    }
  ],
  "important_obligations": [
    {
      "party": "string",
      "obligation": "string",
      "deadline": "string or null",
      "source_section": "string",
      "source_page": "number or null",
      "source_text": "string"
    }
  ],
  "important_dates": [
    {
      "date": "string",
      "description": "string",
      "source_section": "string",
      "source_page": "number or null",
      "source_text": "string"
    }
  ],
  "information_to_collect": ["string array - documents or info to gather"],
  "questions_to_discuss": ["string array - questions for the lawyer"],
  "topics_requiring_clarification": ["string array - areas that need more discussion"]
}`;

// ── Utility: Build context from relevant chunks ─────────────

function buildContext(chunks: DocumentChunk[], maxChunks: number = 30): string {
  const selected = chunks.slice(0, maxChunks);
  return selected.map(c => {
    const meta = [
      c.page ? `Page ${c.page}` : null,
      c.section ? `Section ${c.section}` : null,
      c.clauseNumber ? `Clause ${c.clauseNumber}` : null,
    ].filter(Boolean).join(' • ');
    return `[${meta || `Chunk ${c.index}`}]\n${c.text}`;
  }).join('\n\n---\n\n');
}

// ── Helper: Convert raw AI source to typed SourceReference ──

function toSource(raw: { source_section?: string; source_page?: number | null; source_text?: string; original_text?: string; section?: string; page?: number | null }): SourceReference {
  return {
    section: raw.source_section || raw.section || undefined,
    page: raw.source_page ?? raw.page ?? undefined,
    originalText: raw.source_text || raw.original_text || '',
  };
}

// ── Public API ──────────────────────────────────────────────

/**
 * Analyze a document and extract structured information.
 */
export async function analyzeDocument(
  chunks: DocumentChunk[],
  fileName: string,
  documentId: string,
): Promise<DocumentAnalysis> {
  const context = buildContext(chunks);

  const userPrompt = `Analyze the following legal document named "${fileName}".

DOCUMENT CONTENT:
${context}

Provide a comprehensive analysis following the JSON schema.`;

  const raw = await callAI(ANALYSIS_SYSTEM_PROMPT, userPrompt);
  const parsed = parseAIResponse<{
    document_type: string;
    summary: string;
    key_takeaways: string[];
    key_clauses: Array<{
      title: string;
      clauseNumber?: string;
      page?: number;
      originalText: string;
      plainLanguage: string;
      attentionNote?: string;
      relatedObligations?: string[];
      relatedDates?: string[];
      relatedSections?: string[];
      source_section?: string;
      source_page?: number;
      source_text?: string;
    }>;
    obligations: Array<{
      party: string;
      obligation: string;
      deadline?: string;
      trigger?: string;
      consequence?: string;
      source_section?: string;
      source_page?: number;
      source_text?: string;
    }>;
    deadlines: Array<{
      date: string;
      description: string;
      type: string;
      source_section?: string;
      source_page?: number;
      source_text?: string;
    }>;
    attention_areas: Array<{
      title: string;
      category: string;
      description: string;
      significance: string;
      source_section?: string;
      source_page?: number;
      source_text?: string;
    }>;
  }>(raw, ['document_type', 'summary']);

  // Transform to typed analysis
  const keyClauses: KeyClause[] = (parsed.key_clauses || []).map(c => ({
    title: c.title,
    clauseNumber: c.clauseNumber || undefined,
    page: c.page || undefined,
    originalText: c.originalText,
    plainLanguage: c.plainLanguage,
    attentionNote: c.attentionNote || undefined,
    relatedObligations: c.relatedObligations || [],
    relatedDates: c.relatedDates || [],
    relatedSections: c.relatedSections || [],
    source: {
      section: c.source_section || c.clauseNumber || undefined,
      page: c.source_page || c.page || undefined,
      originalText: c.source_text || c.originalText || '',
    },
  }));

  const obligations: Obligation[] = (parsed.obligations || []).map(o => ({
    party: o.party,
    obligation: o.obligation,
    deadline: o.deadline || undefined,
    trigger: o.trigger || undefined,
    consequence: o.consequence || undefined,
    source: toSource(o),
  }));

  const deadlines: ExtractedDate[] = (parsed.deadlines || []).map(d => ({
    date: d.date,
    description: d.description,
    type: (d.type as ExtractedDate['type']) || 'other',
    source: toSource(d),
  }));

  const attentionAreas: AttentionArea[] = (parsed.attention_areas || []).map(a => ({
    title: a.title,
    category: a.category,
    description: a.description,
    significance: a.significance,
    source: toSource(a),
  }));

  const allSources = [
    ...keyClauses.map(c => c.source),
    ...obligations.map(o => o.source),
    ...deadlines.map(d => d.source),
    ...attentionAreas.map(a => a.source),
  ];

  return {
    documentId,
    documentType: parsed.document_type,
    summary: parsed.summary,
    keyTakeaways: parsed.key_takeaways || [],
    keyClauses,
    obligations,
    deadlines,
    attentionAreas,
    sources: allSources,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Answer a question grounded in document content.
 */
export async function answerQuestion(
  question: string,
  relevantChunks: DocumentChunk[],
): Promise<QAAnswer> {
  const context = buildContext(relevantChunks, 15);

  const userPrompt = `Based ONLY on the following document excerpts, answer this question:

QUESTION: ${question}

DOCUMENT EXCERPTS:
${context}

If the answer is not found in these excerpts, state that clearly.`;

  const raw = await callAI(QA_SYSTEM_PROMPT, userPrompt);
  const parsed = parseAIResponse<{
    answer: string;
    explanation: string;
    is_supported: boolean;
    sources: Array<{ section?: string; page?: number; original_text?: string }>;
    suggested_follow_up?: string;
  }>(raw, ['answer', 'is_supported']);

  return {
    answer: parsed.answer,
    explanation: parsed.explanation || '',
    isSupported: parsed.is_supported,
    sources: (parsed.sources || []).map(s => toSource(s)),
    suggestedFollowUp: parsed.suggested_follow_up || undefined,
  };
}

/**
 * Compare two documents and identify meaningful changes.
 */
export async function compareDocuments(
  chunksA: DocumentChunk[],
  chunksB: DocumentChunk[],
  nameA: string,
  nameB: string,
): Promise<ComparisonResult> {
  const contextA = buildContext(chunksA, 20);
  const contextB = buildContext(chunksB, 20);

  const userPrompt = `Compare these two legal documents and identify meaningful changes.

DOCUMENT A: "${nameA}"
${contextA}

---

DOCUMENT B: "${nameB}"
${contextB}

Identify added, removed, and modified clauses. Focus on substantive changes.`;

  const raw = await callAI(COMPARISON_SYSTEM_PROMPT, userPrompt);
  const parsed = parseAIResponse<{
    total_sections_compared: number;
    summary: string;
    changes: Array<{
      section: string;
      clause_title?: string;
      change_type: 'added' | 'removed' | 'modified';
      old_text?: string;
      new_text?: string;
      explanation: string;
      potential_significance: string;
      source_section?: string;
      source_page_a?: number;
      source_page_b?: number;
    }>;
  }>(raw, ['summary', 'changes']);

  return {
    documentA: { id: '', name: nameA },
    documentB: { id: '', name: nameB },
    totalSections: parsed.total_sections_compared || 0,
    addedCount: (parsed.changes || []).filter(c => c.change_type === 'added').length,
    removedCount: (parsed.changes || []).filter(c => c.change_type === 'removed').length,
    modifiedCount: (parsed.changes || []).filter(c => c.change_type === 'modified').length,
    changes: (parsed.changes || []).map(c => ({
      section: c.section,
      clauseTitle: c.clause_title || undefined,
      changeType: c.change_type,
      oldText: c.old_text || undefined,
      newText: c.new_text || undefined,
      explanation: c.explanation,
      potentialSignificance: c.potential_significance,
      source: {
        section: c.source_section || c.section,
        page: c.source_page_b || c.source_page_a || undefined,
        originalText: c.new_text || c.old_text || '',
      },
    })),
    summary: parsed.summary,
    comparedAt: new Date().toISOString(),
  };
}

/**
 * Generate preparation material for a legal professional meeting.
 */
export async function generatePreparation(
  chunks: DocumentChunk[],
  fileName: string,
  documentId: string,
): Promise<PreparationOutput> {
  const context = buildContext(chunks);

  const userPrompt = `Help a user prepare for a meeting with a legal professional about this document: "${fileName}".

DOCUMENT CONTENT:
${context}

Generate key facts, relevant clauses, questions to discuss, and information to collect.`;

  const raw = await callAI(PREPARATION_SYSTEM_PROMPT, userPrompt);
  const parsed = parseAIResponse<{
    key_facts: Array<{ fact: string; source_section?: string; source_page?: number; source_text?: string }>;
    relevant_clauses: Array<{ clause: string; section: string; source_section?: string; source_page?: number; source_text?: string }>;
    important_obligations: Array<{ party: string; obligation: string; deadline?: string; source_section?: string; source_page?: number; source_text?: string }>;
    important_dates: Array<{ date: string; description: string; source_section?: string; source_page?: number; source_text?: string }>;
    information_to_collect: string[];
    questions_to_discuss: string[];
    topics_requiring_clarification: string[];
  }>(raw, ['key_facts', 'questions_to_discuss']);

  return {
    documentId,
    keyFacts: (parsed.key_facts || []).map(f => ({
      fact: f.fact,
      source: toSource(f),
    })),
    relevantClauses: (parsed.relevant_clauses || []).map(c => ({
      clause: c.clause,
      section: c.section,
      source: toSource(c),
    })),
    importantObligations: (parsed.important_obligations || []).map(o => ({
      party: o.party,
      obligation: o.obligation,
      deadline: o.deadline || undefined,
      source: toSource(o),
    })),
    importantDates: (parsed.important_dates || []).map(d => ({
      date: d.date,
      description: d.description,
      type: 'other' as const,
      source: toSource(d),
    })),
    informationToCollect: parsed.information_to_collect || [],
    questionsToDiscuss: parsed.questions_to_discuss || [],
    topicsRequiringClarification: parsed.topics_requiring_clarification || [],
    generatedAt: new Date().toISOString(),
  };
}
