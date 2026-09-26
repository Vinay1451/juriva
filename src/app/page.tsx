'use client';

import { useState, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { LandingPage } from '@/components/LandingPage';
import { DocumentUpload } from '@/components/DocumentUpload';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { CompareView } from '@/components/CompareView';
import { AskView } from '@/components/AskView';
import { PrepareView } from '@/components/PrepareView';
import { Disclaimer } from '@/components/Disclaimer';
import { DocumentAnalysis } from '@/types';

export type View = 'landing' | 'dashboard' | 'documents' | 'compare' | 'ask' | 'prepare';

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  pageCount?: number;
}

export default function HomePage() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [activeDocument, setActiveDocument] = useState<DocumentInfo | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentInfo[]>([]);

  const handleDocumentUploaded = useCallback((doc: DocumentInfo) => {
    setActiveDocument(doc);
    setUploadedDocuments(prev => [...prev, doc]);
    setCurrentView('dashboard');
  }, []);

  const handleAnalysisComplete = useCallback((result: DocumentAnalysis) => {
    setAnalysis(result);
  }, []);

  const handleNavigate = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const handleSelectDocument = useCallback((doc: DocumentInfo) => {
    setActiveDocument(doc);
    setAnalysis(null);
    setCurrentView('dashboard');
  }, []);

  // Landing page - no navigation bar
  if (currentView === 'landing') {
    return (
      <main id="main-content">
        <LandingPage
          onAnalyze={() => setCurrentView('documents')}
          onCompare={() => setCurrentView('compare')}
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigate}
        documentName={activeDocument?.name}
      />

      <main id="main-content" className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentView === 'documents' && (
            <DocumentUpload
              onDocumentUploaded={handleDocumentUploaded}
              uploadedDocuments={uploadedDocuments}
              onSelectDocument={handleSelectDocument}
            />
          )}

          {currentView === 'dashboard' && activeDocument && (
            <AnalysisDashboard
              document={activeDocument}
              analysis={analysis}
              onAnalysisComplete={handleAnalysisComplete}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'compare' && (
            <CompareView documents={uploadedDocuments} />
          )}

          {currentView === 'ask' && activeDocument && (
            <AskView document={activeDocument} />
          )}

          {currentView === 'prepare' && activeDocument && (
            <PrepareView document={activeDocument} />
          )}

          {(currentView === 'ask' || currentView === 'prepare') && !activeDocument && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4" role="img" aria-label="Document">📄</div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                No Document Selected
              </h2>
              <p className="text-neutral-600 mb-6">
                Upload and analyze a document first to use this feature.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentView('documents')}
              >
                Upload a Document
              </button>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
