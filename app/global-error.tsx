"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { salon } from "@/content";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B0A09] text-[#F3EADF]">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl border border-[#B0703C]/60 bg-[#0B0A09] p-8 text-center shadow-[0_0_4rem_rgba(138,90,43,0.2)] sm:p-12">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-[#B0703C]">
              Something went wrong
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-none text-[#F3EADF] sm:text-6xl">
              Let&apos;s try that again.
            </h1>
            <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[#A79383]">
              The experience hit an unexpected error. You can retry without leaving this page.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-8 border border-[#B0703C] bg-[#B0703C] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#0B0A09] transition-colors hover:bg-[#E8C88A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8C88A]"
            >
              Try again
            </button>
            <p className="mt-10 border-t border-[#B0703C]/30 pt-6 text-xs leading-relaxed text-[#F3EADF]/85">
              {salon.disclaimer}
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
