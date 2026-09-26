'use client';

import { useState } from 'react';
import { QAAnswer, SourceReference } from '@/types';
import { SourceTag, SourcePreview } from '@/components/SourceReference';

interface DocumentInfo {
  id: string;
  name: string;
}

interface AskViewProps {
  document: DocumentInfo;
}

const EXAMPLE_QUESTIONS = [
  'What is the termination notice period?',
  'Does this agreement renew automatically?',
  'What are my payment obligations?',
  'Who owns the intellectual property?',
  'What happens after a breach?',
  'Which sections discuss penalties?',
];

export function AskView({ document }: AskViewProps) {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [conversations, setConversations] = useState<Array<{ question: string; answer: QAAnswer }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<SourceReference | null>(null);

  const askQuestion = async (q: string) => {
    if (!q.trim() || isAsking) return;

    setIsAsking(true);
    setError(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id, question: q.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Could not answer the question.');
      }

      const answer: QAAnswer = await response.json();
      setConversations(prev => [...prev, { question: q.trim(), answer }]);
      setQuestion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(question);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-serif-title tracking-tight">Ask JURIVA</h1>
        <p className="text-slate-600 mt-1 font-normal">
          Ask questions about <strong className="text-emerald-800 font-semibold">{document.name}</strong>. Answers are strictly grounded in document context.
        </p>
      </div>

      {/* Example questions */}
      {conversations.length === 0 && (
        <div className="mb-8 card">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-3">Example Document Queries</p>
          <div className="flex flex-wrap gap-2.5">
            {EXAMPLE_QUESTIONS.map((eq, i) => (
              <button
                key={i}
                className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-800 hover:bg-emerald-50 transition-all font-medium"
                onClick={() => askQuestion(eq)}
                disabled={isAsking}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="space-y-6 mb-6">
        {conversations.map((conv, i) => (
          <div key={i} className="space-y-4">
            {/* Question */}
            <div className="flex justify-end">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-2xl rounded-br-xs px-5 py-3.5 max-w-lg shadow-md shadow-emerald-700/10 text-sm">
                <p>{conv.question}</p>
              </div>
            </div>

            {/* Answer */}
            <div className="card max-w-2xl border-slate-200">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-sm">
                  <span className="text-white font-black text-xs font-serif-title">J</span>
                </div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">JURIVA Intelligence</span>
                {!conv.answer.isSupported && (
                  <span className="badge badge-attention">Not in Document</span>
                )}
              </div>

              <p className="text-slate-900 leading-relaxed mb-4 text-base font-normal">{conv.answer.answer}</p>

              {conv.answer.explanation && (
                <p className="text-sm text-slate-600 mb-4 font-normal leading-relaxed border-l-2 border-slate-200 pl-3">{conv.answer.explanation}</p>
              )}

              {/* Sources */}
              {conv.answer.sources.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Verified Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {conv.answer.sources.map((src, j) => (
                      <SourceTag key={j} source={src} onClick={() => setPreviewSource(src)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up suggestion */}
              {conv.answer.suggestedFollowUp && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-emerald-800 italic font-serif">
                    💼 {conv.answer.suggestedFollowUp}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {isAsking && (
          <div className="card max-w-2xl border-slate-200">
            <div className="flex items-center gap-3">
              <div className="spinner" />
              <p className="text-sm text-emerald-800">Searching document text and synthesizing grounded response...</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4" role="alert">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-slate-300 rounded-2xl p-2 shadow-xl flex gap-2">
        <label htmlFor="question-input" className="sr-only">Ask a question about the document</label>
        <input
          id="question-input"
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask any question about clauses, liabilities, rights, or terms..."
          className="flex-1 px-4 py-3 text-sm border-0 outline-none bg-transparent text-slate-900 placeholder-slate-400 font-normal"
          disabled={isAsking}
          maxLength={1000}
          autoComplete="off"
        />
        <button
          type="submit"
          className="btn btn-primary px-5 py-3"
          disabled={isAsking || !question.trim()}
          aria-label="Submit question"
        >
          {isAsking ? (
            <div className="spinner" style={{ borderTopColor: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </form>

      {/* Source preview */}
      {previewSource && (
        <SourcePreview source={previewSource} onClose={() => setPreviewSource(null)} />
      )}
    </div>
  );
}
