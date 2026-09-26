'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentAnalysis, SourceReference } from '@/types';
import { SourceTag, SourcePreview } from '@/components/SourceReference';
import { View } from '@/app/page';

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  pageCount?: number;
}

interface AnalysisDashboardProps {
  document: DocumentInfo;
  analysis: DocumentAnalysis | null;
  onAnalysisComplete: (analysis: DocumentAnalysis) => void;
  onNavigate: (view: View) => void;
}

type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error';

export function AnalysisDashboard({ document, analysis, onAnalysisComplete, onNavigate }: AnalysisDashboardProps) {
  const [state, setState] = useState<AnalysisState>(analysis ? 'complete' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'clauses' | 'obligations' | 'deadlines' | 'attention'>('summary');
  const [previewSource, setPreviewSource] = useState<SourceReference | null>(null);
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());

  const runAnalysis = useCallback(async () => {
    setState('analyzing');
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const result: DocumentAnalysis = await response.json();
      onAnalysisComplete(result);
      setState('complete');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    }
  }, [document.id, onAnalysisComplete]);

  useEffect(() => {
    if (!analysis && state === 'idle') {
      runAnalysis();
    }
  }, [analysis, state, runAnalysis]);

  const toggleClause = (index: number) => {
    setExpandedClauses(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Loading state
  if (state === 'analyzing') {
    return (
      <div className="text-center py-20">
        <div className="spinner mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Analyzing Document</h2>
        <p className="text-neutral-500">{document.name}</p>
        <p className="text-sm text-neutral-400 mt-2">This may take a moment...</p>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="10" stroke="#e03131" strokeWidth="2"/>
            <path d="M14 9v6M14 18v1" stroke="#e03131" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Analysis Failed</h2>
        <p className="text-neutral-600 mb-6" role="alert">{error}</p>
        <button className="btn btn-primary" onClick={runAnalysis}>
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  const tabs = [
    { id: 'summary' as const, label: 'Summary', count: null },
    { id: 'clauses' as const, label: 'Key Clauses', count: analysis.keyClauses.length },
    { id: 'obligations' as const, label: 'Obligations', count: analysis.obligations.length },
    { id: 'deadlines' as const, label: 'Deadlines', count: analysis.deadlines.length },
    { id: 'attention' as const, label: 'Attention Areas', count: analysis.attentionAreas.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif-title tracking-tight">{document.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="badge badge-success">Verified Analysis</span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full">{analysis.documentType}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary text-xs" onClick={() => onNavigate('ask')}>
            Ask JURIVA
          </button>
          <button className="btn btn-primary text-xs" onClick={() => onNavigate('prepare')}>
            Prepare Strategy
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1" role="tablist" aria-label="Analysis sections">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`tab whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div id={`panel-${activeTab}`} role="tabpanel">
        {/* Summary tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Summary card */}
            <section className="card" aria-labelledby="summary-heading">
              <h2 id="summary-heading" className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-3">
                Executive Plain-Language Summary
              </h2>
              <p className="text-slate-800 leading-relaxed font-normal text-base">{analysis.summary}</p>
            </section>

            {/* Key Takeaways */}
            {analysis.keyTakeaways.length > 0 && (
              <section className="card" aria-labelledby="takeaways-heading">
                <h2 id="takeaways-heading" className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-4">
                  Key Executive Takeaways
                </h2>
                <ul className="space-y-3">
                  {analysis.keyTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-emerald-700" aria-hidden="true">
                          <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-slate-700 text-sm font-normal leading-relaxed">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card text-center hover:border-emerald-300">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">{analysis.keyClauses.length}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key Clauses</p>
              </div>
              <div className="card text-center hover:border-emerald-300">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">{analysis.obligations.length}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Obligations</p>
              </div>
              <div className="card text-center hover:border-emerald-300">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">{analysis.deadlines.length}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadlines</p>
              </div>
              <div className="card text-center hover:border-emerald-300">
                <p className="text-3xl font-extrabold text-amber-700 mb-1">{analysis.attentionAreas.length}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attention Areas</p>
              </div>
            </div>
          </div>
        )}

        {/* Clauses tab */}
        {activeTab === 'clauses' && (
          <div className="space-y-4">
            {analysis.keyClauses.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No key clauses were identified.</p>
            ) : (
              analysis.keyClauses.map((clause, i) => (
                <article key={i} className="card hover:border-slate-300">
                  <div
                    role="button"
                    tabIndex={0}
                    className="expandable-header"
                    onClick={() => toggleClause(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleClause(i);
                      }
                    }}
                    aria-expanded={expandedClauses.has(i)}
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900 font-serif-title text-lg">{clause.title}</h3>
                      {clause.attentionNote && (
                        <span className="badge badge-attention">Attention</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <SourceTag source={clause.source} onClick={() => setPreviewSource(clause.source)} />
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-slate-400 transition-transform ${expandedClauses.has(i) ? 'rotate-180' : ''}`} aria-hidden="true">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  {expandedClauses.has(i) && (
                    <div className="pt-4 space-y-4 border-t border-slate-100 mt-2">
                      {/* Meta */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {clause.clauseNumber && <span className="badge badge-neutral">{clause.clauseNumber}</span>}
                        {clause.page && <span className="badge badge-neutral">Page {clause.page}</span>}
                      </div>

                      {/* Plain language */}
                      <div>
                        <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                          Plain-Language Explanation
                        </h4>
                        <p className="text-sm text-slate-800 leading-relaxed font-normal">{clause.plainLanguage}</p>
                      </div>

                      {/* Original text */}
                      <div>
                        <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                          Original Text
                        </h4>
                        <blockquote className="text-sm text-slate-700 bg-slate-50 border-l-4 border-emerald-600 pl-4 py-3 pr-3 rounded-r-lg italic font-serif">
                          &ldquo;{clause.originalText}&rdquo;
                        </blockquote>
                      </div>

                      {/* Attention note */}
                      {clause.attentionNote && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                            Attention Note
                          </h4>
                          <p className="text-sm text-amber-800">{clause.attentionNote}</p>
                        </div>
                      )}

                      {/* Related items */}
                      {clause.relatedSections && clause.relatedSections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-xs text-slate-500">Related:</span>
                          {clause.relatedSections.map((s, j) => (
                            <span key={j} className="badge badge-info text-xs">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {/* Obligations tab */}
        {activeTab === 'obligations' && (
          <div>
            {analysis.obligations.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No obligations were identified.</p>
            ) : (
              <div className="overflow-x-auto card p-0 overflow-hidden border border-slate-200">
                <table className="w-full text-sm" aria-label="Document obligations">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left font-bold text-slate-700 uppercase tracking-wider text-xs py-3.5 px-4">Party</th>
                      <th className="text-left font-bold text-slate-700 uppercase tracking-wider text-xs py-3.5 px-4">Obligation</th>
                      <th className="text-left font-bold text-slate-700 uppercase tracking-wider text-xs py-3.5 px-4">Deadline</th>
                      <th className="text-left font-bold text-slate-700 uppercase tracking-wider text-xs py-3.5 px-4">Trigger</th>
                      <th className="text-left font-bold text-slate-700 uppercase tracking-wider text-xs py-3.5 px-4">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analysis.obligations.map((ob, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{ob.party}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-normal">{ob.obligation}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{ob.deadline || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-normal">{ob.trigger || '—'}</td>
                        <td className="py-3.5 px-4">
                          <SourceTag source={ob.source} onClick={() => setPreviewSource(ob.source)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Deadlines tab */}
        {activeTab === 'deadlines' && (
          <div className="space-y-4">
            {analysis.deadlines.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No deadlines or dates were identified.</p>
            ) : (
              analysis.deadlines.map((dl, i) => (
                <article key={i} className="card flex items-start gap-4 hover:border-emerald-300">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="text-emerald-700">
                      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-base font-serif-title">{dl.date}</h3>
                      <span className="badge badge-info">{dl.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 font-normal">{dl.description}</p>
                    <SourceTag source={dl.source} onClick={() => setPreviewSource(dl.source)} />
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* Attention Areas tab */}
        {activeTab === 'attention' && (
          <div className="space-y-4">
            {analysis.attentionAreas.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No attention areas were identified.</p>
            ) : (
              analysis.attentionAreas.map((area, i) => (
                <article key={i} className="card border-l-4 border-l-amber-500 hover:border-amber-400">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-slate-900 text-lg font-serif-title">{area.title}</h3>
                    <span className="badge badge-attention">{area.category}</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3 font-normal">{area.description}</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-3">
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Why This Deserves Careful Review
                    </p>
                    <p className="text-sm text-amber-800">{area.significance}</p>
                  </div>
                  <SourceTag source={area.source} onClick={() => setPreviewSource(area.source)} />
                </article>
              ))
            )}
          </div>
        )}
      </div>

      {/* Source preview modal */}
      {previewSource && (
        <SourcePreview source={previewSource} onClose={() => setPreviewSource(null)} />
      )}
    </div>
  );
}
