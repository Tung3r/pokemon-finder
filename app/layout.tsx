import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pokemon Finder - Undervalued Card Discovery",
  description:
    "Find undervalued English Pokemon cards using a quantitative pricing model. Filter by set, character, rarity, and valuation gap.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <span className="text-lg font-bold text-slate-100">
                  Pokemon Finder
                </span>
              </a>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                ENGLISH ONLY
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="hidden sm:inline">
                Quantitative TCG Valuation Engine
              </span>
              <span className="text-xs bg-slate-800 px-2 py-1 rounded">
                MVP v0.1
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-slate-600">
            <p>
              Pokemon Finder &mdash; Undervalued Card Discovery Engine.
              Prices are estimates and not financial advice.
              Data refreshed daily.
            </p>
            <p className="mt-1">
              Model: 4-variable composite (Pull Cost, Character Premium,
              Artwork, Universal Appeal)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
