// ============================================================
// JURIVA — Question Answering API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/documents/store';
import { answerQuestion } from '@/lib/ai/service';
import { retrieveRelevantChunks } from '@/lib/retrieval/search';
import { checkRateLimit, getClientIdentifier, sanitizeInput, getSecurityHeaders } from '@/lib/security';

export async function POST(request: NextRequest) {
  const secHeaders = getSecurityHeaders();

  try {
    // Rate limiting
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = checkRateLimit(clientId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rateLimit.retryAfter} seconds.` },
        { status: 429, headers: { ...secHeaders, 'Retry-After': String(rateLimit.retryAfter) } },
      );
    }

    const body = await request.json();
    const documentId = sanitizeInput(body.documentId || '', 100);
    const question = sanitizeInput(body.question || '', 1000);

    if (!documentId || !question) {
      return NextResponse.json(
        { error: 'Document ID and question are required.' },
        { status: 400, headers: secHeaders },
      );
    }

    if (question.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a more detailed question.' },
        { status: 400, headers: secHeaders },
      );
    }

    const document = getDocument(documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found. It may have expired. Please re-upload.' },
        { status: 404, headers: secHeaders },
      );
    }

    // Retrieve relevant chunks using TF-IDF
    const relevantChunks = retrieveRelevantChunks(question, document.chunks, 10);

    // Get AI answer grounded in retrieved chunks
    const answer = await answerQuestion(question, relevantChunks);

    return NextResponse.json(answer, { headers: secHeaders });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'The AI service is temporarily busy. Please wait and try again.' },
        { status: 429, headers: secHeaders },
      );
    }

    if (message === 'INVALID_API_KEY') {
      return NextResponse.json(
        { error: 'AI service configuration error. Please check the API key.' },
        { status: 401, headers: secHeaders },
      );
    }

    return NextResponse.json(
      { error: 'We couldn\'t answer your question right now. Please try again.' },
      { status: 500, headers: secHeaders },
    );
  }
}
