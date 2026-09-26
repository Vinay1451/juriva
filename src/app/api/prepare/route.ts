// ============================================================
// JURIVA — Preparation API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDocument, savePreparation, getPreparation } from '@/lib/documents/store';
import { generatePreparation } from '@/lib/ai/service';
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

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required.' },
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

    // Check for cached preparation (avoid redundant AI calls)
    const existing = getPreparation(documentId);
    if (existing) {
      return NextResponse.json(existing, { headers: secHeaders });
    }

    const preparation = await generatePreparation(
      document.chunks,
      document.name,
      documentId,
    );

    savePreparation(documentId, preparation);

    return NextResponse.json(preparation, { headers: secHeaders });

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
      { error: 'We couldn\'t generate the preparation right now. Please try again.' },
      { status: 500, headers: secHeaders },
    );
  }
}
