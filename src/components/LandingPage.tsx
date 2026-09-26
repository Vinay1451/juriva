'use client';

interface LandingPageProps {
  onAnalyze: () => void;
  onCompare: () => void;
}

export function LandingPage({ onAnalyze, onCompare }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 text-slate-900">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-md shadow-emerald-700/20">
              <span className="text-white font-black text-base font-serif-title tracking-wider">J</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif-title font-bold text-xl tracking-wider text-slate-900">
                JURIVA
              </span>
              <span className="text-[10px] text-emerald-700 tracking-widest font-bold uppercase -mt-1">
                Legal Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onAnalyze}
              className="btn btn-primary text-xs px-5 py-2"
            >
              Launch App
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 relative z-10">
        <div className="max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-8 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-emerald-600">
              <path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            AI Legal Document Intelligence
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight mb-8 font-serif-title">
            Understand your legal documents.
            <br />
            <span className="text-emerald-gradient">Know what matters.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-6 leading-relaxed font-normal">
            AI-powered document intelligence that turns complex contract clauses into clear actionable insights, compares document versions, and prepares you for legal consultations.
          </p>

          <p className="text-xs tracking-widest text-emerald-800 font-bold uppercase mb-12">
            Understand • Compare • Prepare
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <button
              onClick={onAnalyze}
              className="btn btn-primary text-base px-8 py-4 shadow-lg shadow-emerald-600/20 group"
              id="cta-analyze"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="group-hover:scale-110 transition-transform">
                <path d="M4 2h8l4 4v11a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Analyze a Document
            </button>

            <button
              onClick={onCompare}
              className="btn btn-secondary text-base px-8 py-4 group"
              id="cta-compare"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="group-hover:scale-110 transition-transform text-emerald-600">
                <path d="M3 3h5v14H3zM12 3h5v14h-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
              Compare Documents
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="relative z-10 bg-white border-t border-slate-200 py-24" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="features-heading" className="sr-only">Core Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Understand */}
            <article className="card p-8 group hover:border-emerald-300 transition-all duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-emerald-700">
                  <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-serif-title text-center">Understand</h3>
              <p className="text-slate-600 text-sm leading-relaxed text-center font-normal">
                Translate complex legal jargon into plain-language summaries. Instantly surface hidden risks, obligations, and deadlines.
              </p>
            </article>

            {/* Feature 2: Compare */}
            <article className="card p-8 group hover:border-emerald-300 transition-all duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-emerald-700">
                  <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-serif-title text-center">Compare</h3>
              <p className="text-slate-600 text-sm leading-relaxed text-center font-normal">
                Identify key diffs between contract versions side-by-side. Understand semantic alterations, added liabilities, or removed terms.
              </p>
            </article>

            {/* Feature 3: Prepare */}
            <article className="card p-8 group hover:border-emerald-300 transition-all duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-emerald-700">
                  <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-serif-title text-center">Prepare</h3>
              <p className="text-slate-600 text-sm leading-relaxed text-center font-normal">
                Generate tailored checklists and targeted discussion questions for your attorney meeting. Maximize consultation ROI with verified facts.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Footer Disclaimer */}
      <footer className="border-t border-slate-200 py-8 relative z-10 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
            JURIVA provides AI-assisted legal document information and preparation support.
            It is not a law firm and does not provide professional legal advice.
            AI explanations should be reviewed with a qualified attorney.
          </p>
        </div>
      </footer>
    </div>
  );
}
