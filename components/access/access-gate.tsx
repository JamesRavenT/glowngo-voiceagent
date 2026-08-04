"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { accessCopy, salon } from "@/content";
import { parseAccessProjectId, rawAccessProjectId } from "@/lib/access-gate/env";
import { clearStoredKey, readStoredKey, writeStoredKey } from "@/lib/access-gate/storage";
import { type VerifyOutcome, verifyAccessKey } from "@/lib/access-gate/verify";

type Phase = "checking" | "locked" | "unlocked";
type LockReason = "expired" | "invalid" | "unavailable" | "rate-limited" | "client-error" | "misconfigured";
type Attempt = { source: "stored" | "fresh"; key: string };

export function AccessGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [reason, setReason] = useState<LockReason | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mountCheckRef = useRef<Promise<void> | null>(null);
  const projectIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remainingSeconds = retryAt === null ? 0 : Math.max(0, Math.ceil((retryAt - now) / 1_000));
  const isRateLimited = reason === "rate-limited" && remainingSeconds > 0;

  const applyOutcome = useCallback((outcome: VerifyOutcome, currentAttempt: Attempt) => {
    if (outcome.status === "valid") {
      writeStoredKey(currentAttempt.key);
      setRetryAt(null);
      setReason(null);
      setPhase("unlocked");
      return;
    }

    if (outcome.status === "invalid") {
      if (currentAttempt.source === "stored") {
        clearStoredKey();
        setReason("expired");
      } else {
        setReason("invalid");
      }
      setRetryAt(null);
      setPhase("locked");
      return;
    }

    if (outcome.status === "rate-limited") {
      const deadline = Date.now() + outcome.retryAfterSeconds * 1_000;
      setNow(Date.now());
      setRetryAt(deadline);
      setReason("rate-limited");
      setPhase("locked");
      return;
    }

    setRetryAt(null);
    setReason(outcome.status);
    setPhase("locked");
  }, []);

  const verifyAttempt = useCallback(async (currentAttempt: Attempt) => {
    const projectId = projectIdRef.current;
    if (projectId === null) {
      setReason("misconfigured");
      setPhase("locked");
      return;
    }

    setAttempt(currentAttempt);
    const outcome = await verifyAccessKey(currentAttempt.key, projectId);
    applyOutcome(outcome, currentAttempt);
  }, [applyOutcome]);

  useEffect(() => {
    if (mountCheckRef.current !== null) return;

    const checkStoredAccess = async () => {
      let projectId: string;
      try {
        projectId = parseAccessProjectId(rawAccessProjectId);
      } catch (error) {
        console.error(error);
        setReason("misconfigured");
        setPhase("locked");
        return;
      }

      projectIdRef.current = projectId;
      const storedKey = readStoredKey();
      if (storedKey === null) {
        setReason(null);
        setPhase("locked");
        return;
      }

      await verifyAttempt({ source: "stored", key: storedKey });
    };

    mountCheckRef.current = checkStoredAccess();
  }, [verifyAttempt]);

  useEffect(() => {
    if (phase === "locked" && reason !== "misconfigured") inputRef.current?.focus();
  }, [phase, reason]);

  useEffect(() => {
    if (retryAt === null) return;

    if (Date.now() >= retryAt) return;

    const interval = window.setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      if (currentNow >= retryAt) window.clearInterval(interval);
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [retryAt]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const key = inputValue.trim().toUpperCase();
    if (key === "" || submitting || isRateLimited) return;

    setSubmitting(true);
    try {
      await verifyAttempt({ source: "fresh", key });
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (attempt === null || submitting || isRateLimited) return;

    setSubmitting(true);
    try {
      await verifyAttempt(attempt);
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "unlocked") return children;

  if (phase === "checking") {
    return (
      <main className="nocturne-panel flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink px-6 py-16 text-cream">
        <div className="w-full max-w-xl text-center">
          <p role="status" className="font-utility text-xs uppercase tracking-[0.18em] text-copper">
            {accessCopy.checking}
          </p>
          <p className="mt-10 border-t border-copper/30 pt-6 text-xs leading-relaxed text-muted">
            {salon.disclaimer}
          </p>
        </div>
      </main>
    );
  }

  const alertMessage = reason === "expired"
    ? accessCopy.expired
    : reason === "invalid"
      ? accessCopy.invalid
      : reason === "unavailable"
        ? accessCopy.unavailable
        : reason === "client-error" || reason === "misconfigured"
          ? accessCopy.misconfigured
          : null;
  const showRetry = reason === "unavailable" || reason === "rate-limited";

  return (
    <main className="nocturne-panel flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink px-6 py-16 text-cream">
      <div className="w-full max-w-xl border border-copper/60 bg-ink/95 p-8 shadow-[0_0_4rem_rgb(138_90_43/0.2)] sm:p-12">
        <p className="font-utility text-xs font-medium uppercase tracking-[0.22em] text-copper">Glow &amp; Go</p>
        <h1 className="mt-5 font-display text-5xl font-medium leading-none tracking-[-0.04em] text-cream sm:text-6xl">
          {accessCopy.heading}
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">{accessCopy.intro}</p>

        <form onSubmit={handleSubmit} className="mt-8">
          <label htmlFor="access-key" className="font-utility text-xs font-semibold uppercase tracking-[0.14em] text-gold-hi">
            {accessCopy.inputLabel}
          </label>
          <input
            ref={inputRef}
            id="access-key"
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="characters"
            disabled={reason === "misconfigured"}
            aria-describedby="access-gate-message"
            aria-invalid={reason === "invalid"}
            className="mt-3 w-full border border-copper bg-ink px-4 py-3 font-utility text-sm uppercase tracking-[0.08em] text-cream outline-none focus:border-gold-hi"
          />
          <button
            type="submit"
            disabled={reason === "misconfigured" || submitting || isRateLimited || inputValue.trim() === ""}
            className="mt-4 w-full border border-copper bg-copper px-4 py-3 font-utility text-xs font-semibold uppercase tracking-[0.14em] text-ink hover:bg-gold-hi disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? accessCopy.checking : accessCopy.submitButton}
          </button>
        </form>

        <div id="access-gate-message" role="alert" className="mt-4 min-h-5 text-sm leading-relaxed text-cream">
          {alertMessage}
        </div>

        {reason === "rate-limited" && remainingSeconds > 0 && (
          <p role="status" aria-live="polite" className="mt-2 font-utility text-xs text-gold-hi">
            {accessCopy.rateLimited(remainingSeconds)}
          </p>
        )}

        {showRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={submitting || isRateLimited}
            className="mt-4 border border-copper bg-ink px-5 py-3 font-utility text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-copper hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {accessCopy.retryButton}
          </button>
        )}

        <p className="mt-10 border-t border-copper/30 pt-6 text-xs leading-relaxed text-muted">
          {salon.disclaimer}
        </p>
      </div>
    </main>
  );
}
