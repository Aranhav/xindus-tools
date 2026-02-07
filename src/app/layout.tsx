import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xindus Tools",
  description:
    "Unified portal for IndiaPost tracking, address validation, B2B sheet generation, and HSN classification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main className="min-h-[calc(100vh-8rem)] pt-14">{children}</main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Tools */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tools
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/tracking" className="text-muted-foreground hover:text-foreground transition-colors">
                  IndiaPost Tracker
                </Link>
              </li>
              <li>
                <Link href="/address-validation" className="text-muted-foreground hover:text-foreground transition-colors">
                  Address Validation
                </Link>
              </li>
              <li>
                <Link href="/b2b-sheets" className="text-muted-foreground hover:text-foreground transition-colors">
                  B2B Sheet Generator
                </Link>
              </li>
              <li>
                <Link href="/hsn-classifier" className="text-muted-foreground hover:text-foreground transition-colors">
                  HSN Classifier
                </Link>
              </li>
            </ul>
          </div>

          {/* Original Apps */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Original Apps
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://address-validation-production.up.railway.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Address Validator
                </a>
              </li>
              <li>
                <a
                  href="https://b2b-sheet-generator-production.up.railway.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  B2B Generator
                </a>
              </li>
              <li>
                <a
                  href="https://classify.kaiross.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  HSN Classifier
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://xindus.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Xindus
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Aranhav"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Powered By */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Powered By
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://www.smarty.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Smarty API
                </a>
              </li>
              <li>
                <a
                  href="https://www.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Claude AI
                </a>
              </li>
              <li>
                <a
                  href="https://ai.google.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Gemini AI
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Xindus. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
