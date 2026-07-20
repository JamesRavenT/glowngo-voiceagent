"use client";

import { useEffect, useState, type RefObject } from "react";

import type { CallStatus, TranscriptEntry } from "@/components/call/call-session";

const REVEAL_TICK_MS = 50;
const WORDS_PER_SECOND = 2.5;
const MIN_REVEAL_DURATION_MS = 600;
const MAX_REVEAL_DURATION_MS = 6_000;

function getRevealDuration(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(
    MAX_REVEAL_DURATION_MS,
    Math.max(MIN_REVEAL_DURATION_MS, (wordCount / WORDS_PER_SECOND) * 1_000),
  );
}

type RevealState = {
  inputKey: string;
  knownIds: ReadonlySet<string>;
  lengths: Record<string, number>;
  activeId?: string;
};

function createRevealState(
  entries: readonly TranscriptEntry[],
  inputKey: string,
  previousKnownIds: ReadonlySet<string>,
  animate: boolean,
): RevealState {
  const newEntries = entries.filter((entry) => !previousKnownIds.has(entry.id));
  const newestEntry = newEntries.at(-1);
  const activeId = animate && newestEntry?.speaker === "agent" ? newestEntry.id : undefined;

  return {
    inputKey,
    knownIds: new Set(entries.map((entry) => entry.id)),
    activeId,
    lengths: Object.fromEntries(entries.map((entry) => [
      entry.id,
      entry.id === activeId ? 0 : entry.text.length,
    ])),
  };
}

export function Transcript({
  entries,
  status,
  reducedMotion,
  endRef,
}: {
  entries: readonly TranscriptEntry[];
  status: CallStatus;
  reducedMotion: boolean;
  endRef: RefObject<HTMLDivElement | null>;
}) {
  const terminal = status === "ended" || status === "error";
  const transcriptKey = entries.map(({ id, speaker, text }) => `${id}:${speaker}:${text}`).join("\u0000");
  const inputKey = `${transcriptKey}\u0001${reducedMotion}\u0001${terminal}`;
  const [revealState, setRevealState] = useState<RevealState>(() =>
    createRevealState(entries, inputKey, new Set(), !reducedMotion && !terminal),
  );

  let currentRevealState = revealState;
  if (revealState.inputKey !== inputKey) {
    currentRevealState = createRevealState(
      entries,
      inputKey,
      transcriptKey ? revealState.knownIds : new Set(),
      !reducedMotion && !terminal,
    );
    setRevealState(currentRevealState);
  }
  const activeEntry = entries.find((entry) => entry.id === revealState.activeId);
  const activeId = activeEntry?.id;
  const activeText = activeEntry?.text;

  useEffect(() => {
    if (!activeId || !activeText) return;

    const startedAt = Date.now();
    const duration = getRevealDuration(activeText);
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      const revealedLength = Math.min(
        activeText.length,
        Math.max(1, Math.ceil(activeText.length * progress)),
      );
      setRevealState((current) => ({
        ...current,
        activeId: progress >= 1 ? undefined : current.activeId,
        lengths: { ...current.lengths, [activeId]: revealedLength },
      }));
      if (progress >= 1) window.clearInterval(timer);
    }, REVEAL_TICK_MS);

    return () => window.clearInterval(timer);
  }, [activeId, activeText]);

  return (
    <div
      aria-live="polite"
      aria-label="Call transcript"
      aria-relevant="additions"
      className="call-dialog__transcript mt-4"
    >
      <div className="sr-only">
        {entries.map((entry) => {
          const speaker = entry.speaker === "agent" ? "Agent" : "Caller";
          return <span key={entry.id} className="block">{speaker} says: {entry.text}</span>;
        })}
      </div>
      <div aria-hidden="true">
        {entries.map((entry) => {
          const speaker = entry.speaker === "agent" ? "Agent" : "Caller";
          const revealedLength = currentRevealState.lengths[entry.id]
            ?? (entry.speaker === "caller" ? entry.text.length : 0);
          return (
            <p key={entry.id} data-transcript-entry={entry.id} className="grid grid-cols-[4.5rem_1fr] gap-2 py-1.5">
              <span className="font-semibold uppercase tracking-[0.08em] text-gold-hi">{speaker}</span>
              <span data-revealed-text>{entry.text.slice(0, revealedLength)}</span>
            </p>
          );
        })}
      </div>
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
