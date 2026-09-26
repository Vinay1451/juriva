'use client';

import { useState, useEffect, useCallback } from 'react';
import { PreparationOutput, SourceReference } from '@/types';
import { SourceTag, SourcePreview } from '@/components/SourceReference';

interface DocumentInfo {
  id: string;
  name: string;
}

interface PrepareViewProps {
  document: DocumentInfo;
}

export function PrepareView({ document }: PrepareViewProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'complete' | 'error'>('idle');
  const [preparation, setPreparation] = useState<PreparationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<SourceReference | null>(null);

  const generate = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const response = await fetch('/api/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Preparation failed');
      }

      const data: PreparationOutput = await response.json();
      setPreparation(data);
      setState('complete');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }, [document.id]);

  useEffect(() => {
    if (state === 'idle') {
      generate();
    }
  }, [state, generate]);

  if (state === 'loading') {
    return (
      <div className="text-center py-20">
        <div className="spinner mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Preparing Your Materials</h2>
        <p className="text-neutral-500">Generating preparation notes for <strong>{document.name}</strong>...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Preparation Failed</h2>
        <p className="text-neutral-600 mb-6" role="alert">{error}</p>
        <button className="btn btn-primary" onClick={generate}>Try Again</button>
      </div>
    );
  }

  if (!preparation) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif-title tracking-tight">Prepare for Legal Professional Meeting</h1>
          <p className="text-slate-600 mt-1 font-normal">{document.name}</p>
        </div>
        <button className="btn btn-secondary text-xs px-4 py-2" onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 5V2h8v3M4 11H2V7h12v4h-2M4 9h8v5H4V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          Print Materials
        </button>
      </div>

      <div className="space-y-6">
        {/* Key Facts */}
        {preparation.keyFacts.length > 0 && (
          <section className="card" aria-labelledby="prep-facts">
            <h2 id="prep-facts" className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-4">
              Verified Document Facts
            </h2>
            <ul className="space-y-3">
              {preparation.keyFacts.map((f, i) => (
                <li key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <circle cx="8" cy="8" r="3" fill="#059669"/>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 font-normal">{f.fact}</p>
                    <div className="mt-1">
                      <SourceTag source={f.source} onClick={() => setPreviewSource(f.source)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Relevant Clauses */}
        {preparation.relevantClauses.length > 0 && (
          <section className="card" aria-labelledby="prep-clauses">
            <h2 id="prep-clauses" className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-4">
              Relevant Clauses
            </h2>
            <ul className="space-y-3">
              {preparation.relevantClauses.map((c, i) => (
                <li key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <span className="badge badge-info text-xs flex-shrink-0">{c.section}</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 font-normal">{c.clause}</p>
                    <div className="mt-1">
                      <SourceTag source={c.source} onClick={() => setPreviewSource(c.source)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Important Obligations */}
        {preparation.importantObligations.length > 0 && (
          <section className="card" aria-labelledby="prep-obligations">
            <h2 id="prep-obligations" className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-4">
              Important Obligations
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm" aria-label="Important obligations">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left font-bold text-slate-700 text-xs py-3 px-4">Party</th>
                    <th className="text-left font-bold text-slate-700 text-xs py-3 px-4">Obligation</th>
                    <th className="text-left font-bold text-slate-700 text-xs py-3 px-4">Deadline</th>
                    <th className="text-left font-bold text-slate-700 text-xs py-3 px-4">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preparation.importantObligations.map((ob, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{ob.party}</td>
                      <td className="py-3 px-4 text-slate-700 font-normal">{ob.obligation}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{ob.deadline || '—'}</td>
                      <td className="py-3 px-4">
                        <SourceTag source={ob.source} onClick={() => setPreviewSource(ob.source)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Important Dates */}
        {preparation.importantDates.length > 0 && (
          <section className="card" aria-labelledby="prep-dates">
            <h2 id="prep-dates" className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-4">
              Important Dates
            </h2>
            <ul className="space-y-3">
              {preparation.importantDates.map((d, i) => (
                <li key={i} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-700" aria-hidden="true">
                      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 6h12" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 text-sm">{d.date}</span>
                    <span className="text-sm text-slate-600 ml-2 font-normal">{d.description}</span>
                  </div>
                  <SourceTag source={d.source} onClick={() => setPreviewSource(d.source)} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Information to Collect */}
        {preparation.informationToCollect.length > 0 && (
          <section className="card" aria-labelledby="prep-collect">
            <h2 id="prep-collect" className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-4">
              Information / Documents to Collect
            </h2>
            <ul className="space-y-2.5">
              {preparation.informationToCollect.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <input type="checkbox" id={`collect-${i}`} className="mt-1 accent-emerald-600 w-4 h-4 cursor-pointer" aria-label={item} />
                  <label htmlFor={`collect-${i}`} className="text-sm text-slate-800 cursor-pointer font-normal">{item}</label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Questions to Discuss */}
        {preparation.questionsToDiscuss.length > 0 && (
          <section className="card" aria-labelledby="prep-questions">
            <h2 id="prep-questions" className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-4">
              Questions to Discuss with a Legal Professional
            </h2>
            <ol className="space-y-3 list-decimal list-inside">
              {preparation.questionsToDiscuss.map((q, i) => (
                <li key={i} className="text-sm text-slate-800 leading-relaxed font-normal pl-1">{q}</li>
              ))}
            </ol>
          </section>
        )}

        {/* Topics Requiring Clarification */}
        {preparation.topicsRequiringClarification.length > 0 && (
          <section className="card" aria-labelledby="prep-topics">
            <h2 id="prep-topics" className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              Topics Requiring Clarification
            </h2>
            <ul className="space-y-2">
              {preparation.topicsRequiringClarification.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5 text-yellow-500" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M6.5 6a1.5 1.5 0 013 0c0 .83-.67 1.25-1.5 1.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm text-neutral-700">{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Disclaimer */}
        <div className="disclaimer">
          <p className="text-sm">
            <strong>Note:</strong> This preparation output helps organize information and questions
            for a meeting with a legal professional. It is not legal advice. A qualified professional
            can provide personalized guidance based on your specific circumstances.
          </p>
        </div>
      </div>

      {/* Source preview */}
      {previewSource && (
        <SourcePreview source={previewSource} onClose={() => setPreviewSource(null)} />
      )}
    </div>
  );
}
