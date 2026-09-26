// ============================================================
// JURIVA — Document Analysis API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDocument, saveAnalysis, getAnalysis } from '@/lib/documents/store';
import { analyzeDocument } from '@/lib/ai/service';
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

    // Check for cached analysis (avoid redundant AI calls)
    const existing = getAnalysis(documentId);
    if (existing) {
      return NextResponse.json(existing, { headers: secHeaders });
    }

    // Perform AI analysis
    const analysis = await analyzeDocument(
      document.chunks,
      document.name,
      documentId,
    );

    // Cache the analysis result
    saveAnalysis(documentId, analysis);

    return NextResponse.json(analysis, { headers: secHeaders });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'The AI service is temporarily busy. Please wait a moment and try again.' },
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
      { error: 'We couldn\'t complete the analysis right now. Please try again.' },
      { status: 500, headers: secHeaders },
    );
  }
}
