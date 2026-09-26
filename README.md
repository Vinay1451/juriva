# JURIVA - AI Legal Document Intelligence

**Understand. Compare. Prepare.**

JURIVA is an enterprise-grade legal document intelligence platform powered by Generative AI. It empowers individuals and professionals to analyze, query, compare, and digest complex legal agreements while maintaining strict evidence traceability and explicit legal disclaimers.

---

## Executive Summary & Problem Statement

Legal documents—such as commercial contracts, employment agreements, residential leases, and non-disclosure agreements—contain high-stakes obligations, termination clauses, and indemnity liabilities. Reading and analyzing these documents without technical legal training often leads to missed deadlines or misunderstood terms.

**JURIVA solves this challenge by providing:**
1. **Plain-Language Explanations:** Automated breakdown of complex legalese into clear, accessible prose.
2. **Clause Classification & Risk Scoring:** Structured extraction of high, medium, and low risk provisions.
3. **Obligation & Deadline Mapping:** Organized mapping of contractual duties, timelines, and notice windows.
4. **Document-Grounded Q&A:** Context-aware interactive Q&A powered by Retrieval-Augmented Generation (RAG).
5. **Version Comparison:** Semantic differential analysis identifying additions, deletions, and modifications between document drafts.
6. **Legal Preparation Output:** Automated synthesis of key facts, questions, and structured summaries for attorney consultations.

---

## System Architecture

JURIVA enforces an **Evidence-First RAG Architecture** to eliminate hallucinations and ensure strict traceability:

```
[User Document] -> [Multi-Format Parser] -> [Semantic Chunking Engine]
                                                  |
                                                  v
                                     [TF-IDF Vector Index]
                                                  |
[User Query] -----------------------------> [Retriever]
                                                  |
                                                  v
                                      [Context-Augmented Prompt]
                                                  |
                                                  v
                                      [Groq / Gemini / LLM]
                                                  |
                                                  v
                                     [Validated JSON Schema] -> [Executive UI]
```

### Traceability Pipeline
Every AI statement is linked directly to a verifiable citation:
`AI Insight -> Page Number -> Clause / Section -> Original Excerpt`

---

## Core Features & Modules

| Feature Module | Technical Specification | Business Value |
|---|---|---|
| **Document Ingestion** | Supports PDF (`pdf-parse`), DOCX (`mammoth`), and raw text files up to 10MB | Rapid document parsing with memory-only file processing |
| **Analysis Dashboard** | Extraction of document type, plain summary, key clauses, obligations, and deadlines | Instant executive overview of document contents and risks |
| **Clause Explorer** | Filterable grid with clause type classification, risk badges, and exact excerpts | Seamless navigation through high-liability clauses |
| **Obligation & Deadline Matrix** | Structured breakdown of responsible parties, deadlines, and requirements | Prevents operational defaults and missed termination windows |
| **Ask JURIVA (RAG Q&A)** | TF-IDF retrieval pipeline with source citation linking | Fact-checked answers grounded exclusively in document text |
| **Document Comparison Engine** | Side-by-side semantic diff analysis | Highlights modifications across contract revisions |
| **Legal Consultation Prep** | Automated brief generation containing facts, questions, and checklists | Saves billable legal time prior to attorney meetings |

---

## Technology Stack

- **Framework:** Next.js (App Router, Server Actions)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (Executive Light Corporate Palette: Emerald & Slate Sapphire)
- **AI Core:** Dual Provider Integration (Groq Llama / GPT-OSS 120B & Google Gemini 2.0 Flash)
- **Parsing:** `pdf-parse`, `mammoth`
- **Vector Retrieval:** TF-IDF In-Memory Indexer
- **Testing:** Jest, `ts-jest`
- **Security:** Server-side API key isolation, client-side input sanitization

---

## Security & Privacy Protections

- **Server-Side API Keys:** All API interactions occur securely on the server side via environment variables.
- **In-Memory Storage:** Uploaded files and extracted vectors are processed strictly in RAM and are never persisted to disk.
- **Data Minimization:** No client data or document text is transmitted to third-party services except the configured AI provider endpoint.
- **Input Sanitization:** Multi-layer validation prevents injection payloads and oversized payload ingestion.
- **Zero Secrets Exposure:** Environment variables are strictly excluded from source control (`.gitignore`).

---

## Testing & Quality Assurance

The codebase includes full unit test coverage for core logic engines:

```bash
# Run unit test suite
npx jest
```

### Verified Test Scenarios
- Document format validation (PDF, DOCX, TXT)
- Text chunking and page boundary assignment
- TF-IDF document retrieval relevance ranking
- Document store memory lifecycle
- AI JSON schema parsing and fallback validation
- Network and API rate limit resilience

---

## Installation & Deployment Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Vinay1451/juriva.git
   cd juriva
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create `.env.local` in the project root:
   ```env
   # Groq API Key (Recommended)
   GROQ_API_KEY=your_groq_api_key_here

   # Alternative Provider Configuration
   # AI_API_KEY=your_gemini_api_key_here
   # AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
   # AI_MODEL=gemini-2.0-flash
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` in your web browser.

5. **Build for Production:**
   ```bash
   npx next build
   npm run start
   ```

---

## Regulatory & Legal Disclaimer

JURIVA is an artificial intelligence application designed solely to assist users in reading, navigating, and summarizing legal documents. JURIVA does not render legal advice, formal legal opinions, or legal representation. Using JURIVA does not create an attorney-client relationship. Users should consult a licensed attorney for official advice regarding specific legal rights and obligations.

---

## License & Attribution

Developed for the GenAI Hackathon - AI Legal Document Intelligence.
Copyright 2026 JURIVA Project. All rights reserved.
