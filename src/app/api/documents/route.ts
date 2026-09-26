// ============================================================
// JURIVA — Documents List API
// ============================================================

import { NextResponse } from 'next/server';
import { getAllDocuments, getAnalysis } from '@/lib/documents/store';

export async function GET() {
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

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Could not retrieve documents.' },
      { status: 500 }
    );
  }
}
