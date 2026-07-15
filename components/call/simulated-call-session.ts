"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CallSession, CallStatus, TranscriptEntry } from "@/components/call/call-session";
import { simulatedCallScript } from "@/content";

const transcriptSteps = simulatedCallScript.filter((step) => "speaker" in step);

export function useSimulatedCallSession(): CallSession {
  const [status, setStatus] = useState<CallStatus>("connecting");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcript, setTranscript] = useState<readonly TranscriptEntry[]>([]);
  const [volumes, setVolumes] = useState({ input: 0.01, output: 0.01 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const end = useCallback(() => {
    clearTimer();
    setStatus("ended");
  }, [clearTimer]);

  useEffect(() => {
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.min((Date.now() - startedAtRef.current) / 1000, 18);
      const currentStep = [...simulatedCallScript].reverse().find((step) => step.at <= elapsed);
      const nextStatus = currentStep?.status ?? "connecting";
      const pulse = 0.3 + Math.abs(Math.sin(elapsed * 8)) * 0.55;

      setElapsedSeconds(elapsed);
      setStatus(nextStatus);
      setTranscript(transcriptSteps.filter((step) => step.at <= elapsed).map((step, index) => ({
        id: `simulated-${index}`,
        speaker: step.speaker,
        text: step.text,
        at: step.at,
      })));
      setVolumes({
        input: nextStatus === "listening" ? pulse : 0.01,
        output: nextStatus === "speaking" ? pulse : 0.01,
      });
      if (elapsed >= 18) clearTimer();
    }, 100);

    return clearTimer;
  }, [clearTimer]);

  return { status, transcript, elapsedSeconds, inputVolume: volumes.input, outputVolume: volumes.output, end };
}
