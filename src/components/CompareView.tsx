'use client';

import { useState, useCallback, useRef } from 'react';
import { ComparisonResult, SourceReference } from '@/types';
import { SourceTag, SourcePreview } from '@/components/SourceReference';

interface DocumentInfo {
  id: string;
  name: string;
}

interface CompareViewProps {
  documents: DocumentInfo[];
}

type CompareState = 'select' | 'uploading' | 'comparing' | 'complete' | 'error';

export function CompareView({ documents }: CompareViewProps) {
  const [state, setState] = useState<CompareState>('select');
  const [docA, setDocA] = useState<string>('');
  const [docB, setDocB] = useState<string>('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<SourceReference | null>(null);
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      const data = await res.json();
      return data.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    }
  }, []);

  const handleUploadAndSet = useCallback(async (file: File, target: 'A' | 'B') => {
    setState('uploading');
    const id = await uploadFile(file);
    if (id) {
      if (target === 'A') setDocA(id);
      else setDocB(id);
      setState('select');
    } else {
      setState('error');
    }
  }, [uploadFile]);

  const runComparison = async () => {
    if (!docA || !docB) return;

    setState('comparing');
    setError(null);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIdA: docA, documentIdB: docB }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Comparison failed');
      }

      const data: ComparisonResult = await response.json();
      setResult(data);
      setState('complete');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Comparison failed. Please try again.');
    }
  };

  const changeTypeStyles = {
    added: 'change-added',
    removed: 'change-removed',
    modified: 'change-modified',
  };

  const changeTypeLabels = {
    added: 'Added',
    removed: 'Removed',
    modified: 'Modified',
  };

  const changeTypeBadge = {
    added: 'badge-success',
    removed: 'badge-danger',
    modified: 'badge-attention',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-serif-title tracking-tight">Compare Documents</h1>
        <p className="text-slate-600 mt-1 font-normal">
          Upload or select two document versions to analyze semantic diffs, added obligations, and modified terms.
        </p>
      </div>

      {/* Selection */}
      {(state === 'select' || state === 'uploading') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document A */}
            <div className="card">
              <h2 className="font-serif-title font-bold text-lg text-slate-900 mb-3">Document A (Base Version)</h2>
              {docA ? (
                <div className="flex items-center gap-2.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl font-medium">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-emerald-700">
                    <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Base Document Loaded
                </div>
              ) : (
                <>
                  {documents.length > 0 && (
                    <div className="mb-4">
                      <label htmlFor="select-doc-a" className="text-xs font-bold text-slate-600 mb-1.5 block uppercase tracking-wider">Select existing vault file:</label>
                      <select
                        id="select-doc-a"
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-800 focus:border-emerald-600 outline-none"
                        value={docA}
                        onChange={e => setDocA(e.target.value)}
                      >
                        <option value="">Choose document...</option>
                        {documents.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <input ref={fileInputARef} type="file" accept=".pdf,.docx,.txt" className="hidden" id="compare-file-a"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAndSet(f, 'A'); }}
                  />
                  <button className="btn btn-secondary w-full text-xs py-2.5" onClick={() => fileInputARef.current?.click()}>
                    Upload New Document A
                  </button>
                </>
              )}
            </div>

            {/* Document B */}
            <div className="card">
              <h2 className="font-serif-title font-bold text-lg text-slate-900 mb-3">Document B (Target Version)</h2>
              {docB ? (
                <div className="flex items-center gap-2.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl font-medium">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-emerald-700">
                    <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Target Document Loaded
                </div>
              ) : (
                <>
                  {documents.length > 0 && (
                    <div className="mb-4">
                      <label htmlFor="select-doc-b" className="text-xs font-bold text-slate-600 mb-1.5 block uppercase tracking-wider">Select existing vault file:</label>
                      <select
                        id="select-doc-b"
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-800 focus:border-emerald-600 outline-none"
                        value={docB}
                        onChange={e => setDocB(e.target.value)}
                      >
                        <option value="">Choose document...</option>
                        {documents.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <input ref={fileInputBRef} type="file" accept=".pdf,.docx,.txt" className="hidden" id="compare-file-b"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAndSet(f, 'B'); }}
                  />
                  <button className="btn btn-secondary w-full text-xs py-2.5" onClick={() => fileInputBRef.current?.click()}>
                    Upload New Document B
                  </button>
                </>
              )}
            </div>
          </div>

          {state === 'uploading' && (
            <div className="text-center py-4">
              <div className="spinner mx-auto mb-2" />
              <p className="text-sm text-emerald-800">Uploading version...</p>
            </div>
          )}

          <button
            className="btn btn-primary px-8 py-3.5"
            onClick={runComparison}
            disabled={!docA || !docB || state === 'uploading'}
          >
            Execute Semantic Comparison
          </button>
        </div>
      )}

      {/* Comparing */}
      {state === 'comparing' && (
        <div className="text-center py-20 card">
          <div className="spinner mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-serif-title">Comparing Versions</h2>
          <p className="text-sm text-emerald-800 font-normal">Analyzing clause additions, removals, and semantic modifications...</p>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="text-center py-20 card">
          <h2 className="text-2xl font-bold text-rose-700 mb-2 font-serif-title">Comparison Failed</h2>
          <p className="text-slate-600 mb-6 font-normal" role="alert">{error}</p>
          <button className="btn btn-primary" onClick={() => setState('select')}>
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {state === 'complete' && result && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="card">
            <h2 className="text-xl font-bold text-slate-900 mb-4 font-serif-title">Overview of Comparative Changes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-3xl font-extrabold text-slate-900 mb-1">{result.totalSections}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sections</p>
              </div>
              <div className="text-center bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">{result.addedCount}</p>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Added</p>
              </div>
              <div className="text-center bg-rose-50 p-4 rounded-xl border border-rose-200">
                <p className="text-3xl font-extrabold text-rose-700 mb-1">{result.removedCount}</p>
                <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Removed</p>
              </div>
              <div className="text-center bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="text-3xl font-extrabold text-amber-700 mb-1">{result.modifiedCount}</p>
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Modified</p>
              </div>
            </div>
            <p className="text-slate-800 leading-relaxed font-normal text-base">{result.summary}</p>
          </div>

          {/* Detailed changes */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 font-serif-title">Detailed Clause Diffs</h2>
            {result.changes.map((change, i) => (
              <article key={i} className={`card ${changeTypeStyles[change.changeType]} pl-6`}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-slate-900 font-serif-title text-lg">{change.clauseTitle || change.section}</h3>
                  <span className={`badge ${changeTypeBadge[change.changeType]}`}>
                    {changeTypeLabels[change.changeType]}
                  </span>
                </div>

                {/* Old / New comparison */}
                {change.changeType === 'modified' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                        Version A (Original)
                      </p>
                      <div className="text-sm text-slate-800 bg-rose-50 border border-rose-200 rounded-xl p-3.5 font-normal">
                        {change.oldText || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                        Version B (Updated)
                      </p>
                      <div className="text-sm text-slate-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 font-normal">
                        {change.newText || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {change.changeType === 'added' && change.newText && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                      Newly Added Clause Content
                    </p>
                    <div className="text-sm text-slate-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 font-normal">
                      {change.newText}
                    </div>
                  </div>
                )}

                {change.changeType === 'removed' && change.oldText && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                      Removed Clause Content
                    </p>
                    <div className="text-sm text-slate-700 bg-rose-50 border border-rose-200 rounded-xl p-3.5 line-through font-normal">
                      {change.oldText}
                    </div>
                  </div>
                )}

                <p className="text-sm text-slate-800 mb-3 font-normal leading-relaxed">{change.explanation}</p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-3">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                    Potential Legal Significance
                  </p>
                  <p className="text-sm text-amber-800">{change.potentialSignificance}</p>
                </div>

                <SourceTag source={change.source} onClick={() => setPreviewSource(change.source)} />
              </article>
            ))}
          </div>

          {/* Back to selection */}
          <button
            className="btn btn-secondary text-xs"
            onClick={() => { setState('select'); setDocA(''); setDocB(''); setResult(null); }}
          >
            Compare Different Documents
          </button>
        </div>
      )}

      {/* Source preview */}
      {previewSource && (
        <SourcePreview source={previewSource} onClose={() => setPreviewSource(null)} />
      )}
    </div>
  );
}
