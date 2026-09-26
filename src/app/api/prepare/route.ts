// ============================================================
// JURIVA — Preparation API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDocument, savePreparation, getPreparation } from '@/lib/documents/store';
import { generatePreparation } from '@/lib/ai/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required.' },
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

    // Check for cached preparation
    const existing = getPreparation(documentId);
    if (existing) {
      return NextResponse.json(existing);
    }

    const preparation = await generatePreparation(
      document.chunks,
      document.name,
      documentId,
    );

    savePreparation(documentId, preparation);

    return NextResponse.json(preparation);

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
      { error: 'We couldn\'t generate the preparation right now. Please try again.' },
      { status: 500 }
    );
  }
}
