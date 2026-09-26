// ============================================================
// JURIVA — Document Comparison API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/documents/store';
import { compareDocuments } from '@/lib/ai/service';
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
    const documentIdA = sanitizeInput(body.documentIdA || '', 100);
    const documentIdB = sanitizeInput(body.documentIdB || '', 100);

    if (!documentIdA || !documentIdB) {
      return NextResponse.json(
        { error: 'Two document IDs are required for comparison.' },
        { status: 400, headers: secHeaders },
      );
    }

    if (documentIdA === documentIdB) {
      return NextResponse.json(
        { error: 'Please select two different documents to compare.' },
        { status: 400, headers: secHeaders },
      );
    }

    const docA = getDocument(documentIdA);
    const docB = getDocument(documentIdB);

    if (!docA || !docB) {
      return NextResponse.json(
        { error: 'One or both documents not found. They may have expired.' },
        { status: 404, headers: secHeaders },
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

    return NextResponse.json(result, { headers: secHeaders });

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
      { error: 'We couldn\'t complete the comparison right now. Please try again.' },
      { status: 500, headers: secHeaders },
    );
  }
}
