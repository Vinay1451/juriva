// ============================================================
// JURIVA — Document Upload API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { extractText, chunkDocument } from '@/lib/documents/processor';
import { saveDocument, generateDocumentId } from '@/lib/documents/store';
import { SupportedFileType } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

const ALLOWED_EXTENSIONS: Record<string, SupportedFileType> = {
  'pdf': 'pdf',
  'docx': 'docx',
  'txt': 'txt',
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload a document.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'The file is empty. Please upload a valid document.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds the 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).` },
        { status: 400 }
      );
    }

    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const fileType = ALLOWED_TYPES[file.type] || ALLOWED_EXTENSIONS[ext];

    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.' },
        { status: 400 }
      );
    }

    // Extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text: string;
    let pages: number;

    try {
      const result = await extractText(buffer, fileType);
      text = result.text;
      pages = result.pages;
    } catch {
      return NextResponse.json(
        { error: 'Could not process this file. It may be corrupted or password-protected.' },
        { status: 422 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'No readable text found. The document may be scanned or image-based.' },
        { status: 422 }
      );
    }

    // Chunk document for retrieval
    const chunks = chunkDocument(text, pages);
    const documentId = generateDocumentId();

    // Save to in-memory store (no disk persistence for privacy)
    saveDocument({
      id: documentId,
      name: file.name,
      type: fileType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      chunks,
      fullText: text,
      pageCount: pages,
    });

    return NextResponse.json({
      id: documentId,
      name: file.name,
      type: fileType,
      size: file.size,
      pageCount: pages,
      chunkCount: chunks.length,
    });

  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload. Please try again.' },
      { status: 500 }
    );
  }
}
