// ============================================================
// JURIVA — Question Answering API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/documents/store';
import { answerQuestion } from '@/lib/ai/service';
import { retrieveRelevantChunks } from '@/lib/retrieval/search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, question } = body;

    if (!documentId || !question) {
      return NextResponse.json(
        { error: 'Document ID and question are required.' },
        { status: 400 }
      );
    }

    if (typeof question !== 'string' || question.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a more detailed question.' },
        { status: 400 }
      );
    }

    if (question.length > 1000) {
      return NextResponse.json(
        { error: 'Question is too long. Please keep it under 1000 characters.' },
        { status: 400 }
      );
    }

    const document = getDocument(documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found. It may have expired. Please re-upload.' },
        { status: 404 }
      );
    }

    // Retrieve relevant chunks using TF-IDF
    const relevantChunks = retrieveRelevantChunks(question, document.chunks, 10);

    // Get AI answer grounded in retrieved chunks
    const answer = await answerQuestion(question, relevantChunks);

    return NextResponse.json(answer);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'The AI service is temporarily busy. Please wait and try again.' },
        { status: 429 }
      );
    }

    if (message === 'INVALID_API_KEY') {
      return NextResponse.json(
        { error: 'AI service configuration error. Please check the API key.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'We couldn\'t answer your question right now. Please try again.' },
      { status: 500 }
    );
  }
}
