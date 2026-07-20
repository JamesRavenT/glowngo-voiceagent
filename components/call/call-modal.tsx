"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { useCall } from "@/components/call/call-provider";
import type { CallSession } from "@/components/call/call-session";
import { staticCallSessionFixture } from "@/components/call/static-call-session.fixture";
import { Transcript } from "@/components/call/transcript";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { callCopy, salon } from "@/content";
import type { AgentMode } from "@/lib/env";
import { publicEnv } from "@/lib/env";
import { formatCallDuration } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

const CONNECTION_TIMEOUT_MS = 20_000;
const RINGTONE_VOLUME = 0.5;

function playAudio(audio: HTMLAudioElement) {
  try {
    void audio.play().catch(() => undefined);
  } catch {
    // Decorative audio must not interrupt the call flow.
  }
}

function releaseAudio(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
  audio.removeAttribute("src");
}

export function CallModal({ session = staticCallSessionFixture, mode = "simulated" }: { session?: CallSession; mode?: AgentMode }) {
  const { isOpen, close, minimize } = useCall();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const terminalButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dismissalRef = useRef<"close" | "minimize">("close");
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedEndSoundRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const failSession = session.fail;
  const isActive = session.status === "listening" || session.status === "speaking" || session.status === "thinking";
  const isLive = session.status === "connecting" || isActive;
  const showTranscript = isActive || session.status === "ended";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      if (!returnFocusRef.current) {
        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      dialog.showModal();
      (startButtonRef.current ?? closeButtonRef.current)?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !showTranscript) return;
    transcriptEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [isOpen, session.transcript, showTranscript]);

  useEffect(() => {
    if (session.status !== "connecting") return;

    const ringtone = new Audio("/audio/ring.wav");
    ringtone.loop = true;
    ringtone.volume = RINGTONE_VOLUME;
    ringtoneRef.current = ringtone;
    playAudio(ringtone);

    const timeout = mode === "live"
      ? window.setTimeout(() => failSession(callCopy.connectionError), CONNECTION_TIMEOUT_MS)
      : undefined;
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      releaseAudio(ringtone);
      if (ringtoneRef.current === ringtone) ringtoneRef.current = null;
    };
  }, [failSession, mode, session.status]);

  useEffect(() => {
    if (session.status !== "ended" || hasPlayedEndSoundRef.current) return;
    hasPlayedEndSoundRef.current = true;
    const endSound = new Audio("/audio/end.wav");
    playAudio(endSound);
  }, [session.status]);

  useEffect(() => {
    if (session.status === "ended" || session.status === "error") {
      terminalButtonRef.current?.focus();
    }
  }, [session.status]);

  useEffect(() => () => {
    if (ringtoneRef.current) releaseAudio(ringtoneRef.current);
    ringtoneRef.current = null;
  }, []);

  const handleClosed = () => {
    if (dismissalRef.current === "minimize") {
      minimize();
    } else {
      close();
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    }
    dismissalRef.current = "close";
  };

  const dismissDialog = () => {
    dismissalRef.current = isLive ? "minimize" : "close";
    dialogRef.current?.close();
  };

  const closeDialog = () => {
    dismissalRef.current = "close";
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="call-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        dismissDialog();
      }}
      onClose={handleClosed}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismissDialog();
      }}
      className="call-dialog"
    >
      <section className="call-dialog__panel">
        <header className="flex items-start justify-between gap-6 font-utility text-[0.65rem] uppercase tracking-[0.16em] text-gold-hi">
          <div>
            <h2 id="call-dialog-title" className="font-inherit text-inherit">Glow & Go voice assistant</h2>
            <p aria-live="polite" aria-atomic="true" className="mt-1 text-copper">{callCopy.statusLabels[session.status]}</p>
          </div>
          <div className="flex items-center gap-3">
            <time className="tabular-nums text-cream" aria-label={`Call duration ${formatCallDuration(session.elapsedSeconds)}`}>
              {formatCallDuration(session.elapsedSeconds)}
            </time>
            <button ref={closeButtonRef} type="button" aria-label={callCopy.closeButton} onClick={dismissDialog} className="relative z-10 rounded-full p-1 text-cream hover:bg-copper hover:text-ink">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        </header>

        {mode === "simulated" && (
          <p role="status" className="relative z-10 mt-3 border border-gold-hi bg-ink px-3 py-2 font-utility text-xs font-semibold uppercase tracking-[0.08em] text-gold-hi">
            {callCopy.simulatedBadge}
          </p>
        )}

        {session.status === "consent" && (
          <div data-call-state="consent" className="relative z-10 mt-5 space-y-3 text-center text-sm leading-relaxed text-cream">
            <h3 className="font-display text-3xl font-semibold leading-none tracking-[-0.025em] text-gold-hi sm:text-4xl">
              {callCopy.consentHeading}
            </h3>
            <p>{salon.disclaimer}</p>
            <p className="text-muted">{callCopy.publicBookingWarning}</p>
            <button ref={startButtonRef} type="button" onClick={session.start} className="mt-2 w-full border border-copper bg-copper px-4 py-3 font-utility text-xs font-semibold uppercase tracking-[0.14em] text-ink hover:bg-gold-hi">
              {callCopy.startCallButton}
            </button>
          </div>
        )}

        {session.errorMessage && <p role="alert" className="relative z-10 mt-4 text-sm font-semibold text-cream">{session.errorMessage}</p>}

        {session.status === "ended" && (
          <div className="relative z-10 mt-4 text-sm leading-relaxed text-cream">
            <p>{callCopy.thankYou}</p>
            {publicEnv.bookingSheetUrl && (
              <a href={publicEnv.bookingSheetUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-gold-hi underline decoration-copper underline-offset-4">
                {callCopy.bookingSheetLink}
              </a>
            )}
          </div>
        )}

        {(session.status === "connecting" || isActive) && (reducedMotion ? (
          <div role="img" aria-label="Audio waveform idle" className="mt-4 mb-3 h-14 border-y border-dotted border-copper/35" />
        ) : (
          <LiveWaveform
            active={false}
            processing
            barColor="#E8C88A"
            barHeight={4 + Math.max(session.inputVolume, session.outputVolume) * 24}
            height={56}
            className="mt-4 mb-3 text-gold-hi"
          />
        ))}

        {showTranscript && (
          <Transcript
            entries={session.transcript}
            status={session.status}
            reducedMotion={reducedMotion}
            endRef={transcriptEndRef}
          />
        )}

        {(session.status === "connecting" || isActive) && (
          <button type="button" onClick={session.end} className="relative z-10 mt-5 w-full border border-copper bg-ink px-4 py-3 font-utility text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-copper hover:text-ink">
            {callCopy.endCallButton}
          </button>
        )}

        {(session.status === "ended" || session.status === "error") && (
          <button ref={terminalButtonRef} type="button" onClick={closeDialog} className="relative z-10 mt-5 w-full border border-copper bg-ink px-4 py-3 font-utility text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-copper hover:text-ink">
            {callCopy.closeButton}
          </button>
        )}
      </section>
    </dialog>
  );
}
