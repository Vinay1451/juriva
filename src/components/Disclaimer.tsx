'use client';

export function Disclaimer() {
  return (
    <aside className="disclaimer" role="note" aria-label="Legal disclaimer">
      <div className="flex items-start gap-2">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p>
          JURIVA provides AI-assisted legal document information and preparation support.
          It is not a lawyer and does not provide professional legal advice.
          AI-generated explanations may contain errors. Review important matters with a
          qualified legal professional.
        </p>
      </div>
    </aside>
  );
}
