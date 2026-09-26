// ============================================================
// JURIVA — File Validation
// ============================================================

import { FileValidationResult, SupportedFileType } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

const ALLOWED_EXTENSIONS: Record<string, SupportedFileType> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.txt': 'txt',
};

/**
 * Validates an uploaded file for type, size, and content.
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size === 0) {
    return { valid: false, error: 'The file is empty. Please upload a valid document.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMB} MB) exceeds the 10 MB limit. Please upload a smaller document.`,
    };
  }

  // Check MIME type
  const mimeType = ALLOWED_TYPES[file.type];

  // Check extension as fallback
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const extType = ALLOWED_EXTENSIONS[extension];

  const fileType = mimeType || extType;

  if (!fileType) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.',
    };
  }

  return { valid: true, fileType };
}

/**
 * Returns human-readable file size.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
