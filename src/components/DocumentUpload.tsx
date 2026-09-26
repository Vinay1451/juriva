'use client';

import { useState, useCallback, useRef } from 'react';

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  pageCount?: number;
}

interface DocumentUploadProps {
  onDocumentUploaded: (doc: DocumentInfo) => void;
  uploadedDocuments: DocumentInfo[];
  onSelectDocument: (doc: DocumentInfo) => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'error';

export function DocumentUpload({ onDocumentUploaded, uploadedDocuments, onSelectDocument }: DocumentUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploadState('uploading');
    setProgress(20);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setProgress(50);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      setUploadState('processing');
      setProgress(90);

      const data = await response.json();
      setProgress(100);
      setUploadState('idle');

      onDocumentUploaded({
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        pageCount: data.pageCount,
      });
    } catch (err) {
      setUploadState('error');
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  }, [onDocumentUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFile]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 font-serif-title tracking-tight">Documents</h1>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
          Secure Processing
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone transition-all duration-200 ${dragOver ? 'drag-over border-emerald-600 bg-emerald-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload a document by clicking or dragging a file here"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleChange}
          className="hidden"
          aria-hidden="true"
          id="file-upload-input"
        />

        {uploadState === 'idle' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="text-emerald-700">
                <path d="M14 18V7m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 19v3a2 2 0 002 2h14a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="font-bold text-lg text-slate-900 mb-1 font-serif-title">
              Drop your legal contract here or click to browse
            </p>
            <p className="text-sm text-slate-500 font-normal">
              Supports PDF, DOCX, or TXT — up to 10 MB
            </p>
          </>
        )}

        {(uploadState === 'uploading' || uploadState === 'processing') && (
          <div className="space-y-4">
            <div className="spinner mx-auto" />
            <p className="font-semibold text-emerald-800">
              {uploadState === 'uploading' ? 'Uploading document securely...' : 'Analyzing document structure & vectors...'}
            </p>
            <div className="progress-bar max-w-xs mx-auto">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {uploadState === 'error' && (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="text-rose-600">
                <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M14 9v6M14 18v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="font-medium text-rose-700 text-sm" role="alert">{error}</p>
            <button
              className="btn btn-secondary text-xs"
              onClick={(e) => { e.stopPropagation(); setUploadState('idle'); setError(null); }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Uploaded documents list */}
      {uploadedDocuments.length > 0 && (
        <section className="mt-10" aria-label="Uploaded documents">
          <h2 className="text-xl font-bold text-slate-900 mb-4 font-serif-title">
            Uploaded Vault Documents ({uploadedDocuments.length})
          </h2>
          <div className="space-y-3">
            {uploadedDocuments.map(doc => (
              <button
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="card w-full text-left flex items-center gap-4 hover:border-emerald-300 cursor-pointer group transition-all"
                aria-label={`Open ${doc.name}`}
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-all">
                  <span className="text-emerald-800 font-extrabold text-xs uppercase tracking-wider">{doc.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{doc.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatSize(doc.size)}
                    {doc.pageCount && ` • ${doc.pageCount} page${doc.pageCount > 1 ? 's' : ''}`}
                  </p>
                </div>
                <span className="btn btn-secondary text-xs py-1.5 px-3">
                  Open Analysis
                </span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400 group-hover:text-emerald-700 flex-shrink-0 transition-colors" aria-hidden="true">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
