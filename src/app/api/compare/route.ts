// ============================================================
// JURIVA — Document Comparison API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/documents/store';
import { compareDocuments } from '@/lib/ai/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentIdA, documentIdB } = body;

    if (!documentIdA || !documentIdB) {
      return NextResponse.json(
        { error: 'Two document IDs are required for comparison.' },
        { status: 400 }
      );
    }

    if (documentIdA === documentIdB) {
      return NextResponse.json(
        { error: 'Please select two different documents to compare.' },
        { status: 400 }
      );
    }

    const docA = getDocument(documentIdA);
    const docB = getDocument(documentIdB);

    if (!docA || !docB) {
      return NextResponse.json(
        { error: 'One or both documents not found. They may have expired.' },
        { status: 404 }
      );
    }

    const result = await compareDocuments(
      docA.chunks,
      docB.chunks,
      docA.name,
      docB.name,
    );

    // Set document IDs
    result.documentA.id = documentIdA;
    result.documentB.id = documentIdB;

    return NextResponse.json(result);

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
      { error: 'We couldn\'t complete the comparison right now. Please try again.' },
      { status: 500 }
    );
  }
}
