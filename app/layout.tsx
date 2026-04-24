import type { Metadata } from "next";
import { Inter, Fraunces, Caveat, Permanent_Marker } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-hand" });
const permanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Scrapbook - Family design editor",
  description: "A simple page editor for family scrapbook layouts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${caveat.variable} ${permanentMarker.variable}`}
    >
      <body className={`${inter.className} min-h-dvh`}>
        {children}
        {/*
         Ensure display fonts are fetched for Konva/canvas (font-family strings) even when
         not used in the React tree yet; zero layout impact.
         */}
        <div className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0" aria-hidden>
          <span className={fraunces.className}> </span>
          <span className={caveat.className}> </span>
          <span className={permanentMarker.className}> </span>
        </div>
      </body>
    </html>
  );
}
