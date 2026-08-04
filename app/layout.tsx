import type { Metadata } from "next";
import { Cormorant_Garamond, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { AccessGate } from "@/components/access/access-gate";
import { Navbar } from "@/components/layout/navbar";
import { CallProvider } from "@/components/call/call-provider";
import { FloatingCallButton } from "@/components/call/floating-call-button";
import { CallSessionSelector } from "@/components/call/call-session-selector";
import { siteCopy } from "@/content/salon";
import "@/app/globals.css";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteCopy.metadataTitle,
  description: siteCopy.metadataDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${interTight.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AccessGate>
          <CallProvider>
            <a className="skip-link" href="#main-content">
              {siteCopy.skipToContent}
            </a>
            <Navbar />
            {children}
            <FloatingCallButton />
            <CallSessionSelector />
          </CallProvider>
        </AccessGate>
      </body>
    </html>
  );
}
