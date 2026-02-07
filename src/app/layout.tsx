import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
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
    <html lang="en">
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <Navbar />
        <main className="pt-14">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
