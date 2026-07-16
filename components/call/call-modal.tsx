"use client";

import { useEffect, useRef } from "react";

import { useCall } from "@/components/call/call-provider";
import type { CallSession, CallStatus } from "@/components/call/call-session";
import { staticCallSessionFixture } from "@/components/call/static-call-session.fixture";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { formatCallDuration } from "@/lib/format";
import { callCopy } from "@/content";
import type { AgentMode } from "@/lib/env";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

const statusLabels: Record<CallStatus, string> = {
  connecting: "Connecting",
  listening: "Listening",
  speaking: "Speaking",
  thinking: "Thinking",
  ended: "Call ended",
  error: "Call error",
};

export function CallModal({ session = staticCallSessionFixture, mode = "simulated" }: { session?: CallSession; mode?: AgentMode }) {
  const { isOpen, close } = useCall();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    transcriptEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [isOpen, session.transcript]);

  const handleClosed = () => {
    close();
    returnFocusRef.current?.focus();
  };

  const handleEnd = () => {
    session.end();
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="call-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        dialogRef.current?.close();
      }}
      onClose={handleClosed}
      className="call-dialog"
    >
      <section className="call-dialog__panel">
        <header className="flex items-start justify-between gap-6 font-utility text-[0.65rem] uppercase tracking-[0.16em] text-gold-hi">
          <div>
            <h2 id="call-dialog-title" className="font-inherit text-inherit">Glow & Go voice assistant</h2>
            <p className="mt-1 text-copper">{statusLabels[session.status]}</p>
          </div>
          <time className="tabular-nums text-cream" aria-label={`Call duration ${formatCallDuration(session.elapsedSeconds)}`}>
            {formatCallDuration(session.elapsedSeconds)}
          </time>
        </header>

        {mode === "simulated" && (
          <p role="status" className="relative z-10 mt-3 border border-gold-hi bg-ink px-3 py-2 font-utility text-xs font-semibold uppercase tracking-[0.08em] text-gold-hi">
            {callCopy.simulatedBadge}
          </p>
        )}

        {session.errorMessage && <p role="alert" className="relative z-10 mt-3 text-sm font-semibold text-cream">{session.errorMessage}</p>}

        {reducedMotion ? (
          <div role="img" aria-label="Audio waveform idle" className="mt-4 mb-3 h-14 border-y border-dotted border-copper/35" />
        ) : (
          <LiveWaveform
            active={false}
            processing={session.status !== "ended" && session.status !== "error"}
            barColor="#E8C88A"
            barHeight={4 + Math.max(session.inputVolume, session.outputVolume) * 24}
            height={56}
            className="mt-4 mb-3 text-gold-hi"
          />
        )}

        <div aria-live="polite" aria-label="Call transcript" className="call-dialog__transcript">
          {session.transcript.map((entry) => {
            const speaker = entry.speaker === "agent" ? "Agent" : "Caller";
            return (
              <p key={entry.id} className="grid grid-cols-[4.5rem_1fr] gap-2 py-1.5">
                <span className="font-semibold uppercase tracking-[0.08em] text-gold-hi">{speaker}</span>
                <span><span className="sr-only">{speaker} says: </span>{entry.text}</span>
              </p>
            );
          })}
          <div ref={transcriptEndRef} aria-hidden="true" />
        </div>

        <button type="button" onClick={handleEnd} className="relative z-10 mt-5 w-full border border-copper bg-ink px-4 py-3 font-utility text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-copper hover:text-ink">
          End call
        </button>
      </section>
    </dialog>
  );
}
