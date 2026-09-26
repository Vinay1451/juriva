import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JURIVA — AI Legal Document Intelligence",
  description:
    "Understand, compare, and navigate legal documents using AI. JURIVA helps you make sense of complex legal language while keeping professional legal advice where it belongs.",
  keywords: [
    "legal document analysis",
    "AI legal assistant",
    "contract analysis",
    "document comparison",
    "legal intelligence",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
