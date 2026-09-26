// ============================================================
// JURIVA — Documents List API
// ============================================================

import { NextResponse } from 'next/server';
import { getAllDocuments, getAnalysis } from '@/lib/documents/store';
import { getSecurityHeaders } from '@/lib/security';

export async function GET() {
  const secHeaders = getSecurityHeaders();

  try {
    const documents = getAllDocuments();

    const result = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      uploadedAt: doc.uploadedAt,
      pageCount: doc.pageCount,
      chunkCount: doc.chunks.length,
      hasAnalysis: !!getAnalysis(doc.id),
    }));

    return NextResponse.json(result, { headers: secHeaders });
  } catch {
    return NextResponse.json(
      { error: 'Could not retrieve documents.' },
      { status: 500, headers: secHeaders },
    );
  }
}
