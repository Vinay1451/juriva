'use client';

import { View } from '@/app/page';

interface NavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  documentName?: string;
}

const NAV_ITEMS: Array<{ view: View; label: string }> = [
  { view: 'documents', label: 'Documents' },
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'compare', label: 'Compare' },
  { view: 'ask', label: 'Ask JURIVA' },
  { view: 'prepare', label: 'Prepare' },
];

export function Navigation({ currentView, onNavigate, documentName }: NavigationProps) {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 group text-left"
            aria-label="Go to JURIVA home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
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
          </button>

          {/* Navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ view, label }) => (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                className={`tab ${currentView === view ? 'active' : ''}`}
                aria-current={currentView === view ? 'page' : undefined}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Active document indicator */}
          {documentName && (
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg max-w-[220px]">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 1h5.586L13 4.414V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <span className="truncate" title={documentName}>{documentName}</span>
            </div>
          )}

          {/* Mobile menu */}
          <nav aria-label="Mobile navigation" className="flex md:hidden">
            <select
              value={currentView}
              onChange={(e) => onNavigate(e.target.value as View)}
              className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:border-emerald-600"
              aria-label="Navigate to section"
            >
              {NAV_ITEMS.map(({ view, label }) => (
                <option key={view} value={view}>{label}</option>
              ))}
            </select>
          </nav>
        </div>
      </div>
    </header>
  );
}
