'use client';

import { SourceReference } from '@/types';

interface SourceTagProps {
  source: SourceReference;
  onClick?: () => void;
}

export function SourceTag({ source, onClick }: SourceTagProps) {
  const parts: string[] = [];
  if (source.page) parts.push(`Page ${source.page}`);
  if (source.section) parts.push(source.section);
  if (source.clauseNumber) parts.push(`Clause ${source.clauseNumber}`);

  const label = parts.length > 0 ? parts.join(' • ') : 'Source';

  return (
    <span
      role="button"
      tabIndex={0}
      className="source-tag"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          onClick?.();
        }
      }}
      title={source.originalText ? `"${source.originalText.substring(0, 100)}..."` : label}
      aria-label={`View source: ${label}`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3 1h4.5L10 3.5V10a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
      {label}
    </span>
  );
}

interface SourcePreviewProps {
  source: SourceReference;
  onClose: () => void;
}

export function SourcePreview({ source, onClose }: SourcePreviewProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Source reference preview"
    >
      <div
        className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto shadow-2xl shadow-amber-500/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-serif-title font-bold text-lg text-amber-300">Document Source Reference</h3>
          <button
            onClick={onClose}
            className="btn-ghost rounded-lg p-1 text-slate-400 hover:text-white"
            aria-label="Close source preview"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {source.page && (
              <span className="badge badge-info">Page {source.page}</span>
            )}
            {source.section && (
              <span className="badge badge-neutral">{source.section}</span>
            )}
            {source.clauseNumber && (
              <span className="badge badge-neutral">Clause {source.clauseNumber}</span>
            )}
          </div>

          {source.originalText && (
            <div>
              <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2">
                Original Verified Excerpt
              </p>
              <blockquote className="text-sm text-slate-200 bg-slate-950/80 border-l-4 border-amber-500 pl-4 py-3 pr-3 rounded-r-lg leading-relaxed font-serif italic">
                &ldquo;{source.originalText}&rdquo;
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
