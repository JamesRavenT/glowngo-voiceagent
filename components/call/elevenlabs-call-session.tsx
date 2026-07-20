"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useState } from "react";

import type { CallSession, CallStatus, TranscriptEntry } from "@/components/call/call-session";
import { callCopy } from "@/content";

type SdkMessage = { message: string; role?: "user" | "agent"; source?: "user" | "ai"; event_id?: number };

export function mapElevenLabsMessage(message: SdkMessage, at: number, index: number): TranscriptEntry {
  return {
    id: message.event_id === undefined ? `live-${index}` : `live-${message.event_id}`,
    speaker: message.role === "agent" || message.source === "ai" ? "agent" : "caller",
    text: message.message,
    at,
  };
}

export function mapElevenLabsStatus(
  status: "disconnected" | "connecting" | "connected" | "error",
  mode: "speaking" | "listening",
): CallStatus {
  if (status === "error") return "error";
  if (status === "disconnected") return "ended";
  if (status === "connecting") return "connecting";
  return mode;
}

export function mapElevenLabsError(message: string): string {
  return /permission|notallowed|microphone|audio input/i.test(message)
    ? callCopy.micPermissionError
    : callCopy.connectionError;
}

function ElevenLabsSession({ children }: { children: (session: CallSession) => React.ReactNode }) {
  const [status, setStatus] = useState<CallStatus>("consent");
  const [transcript, setTranscript] = useState<readonly TranscriptEntry[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [volumes, setVolumes] = useState({ input: 0, output: 0 });
  const [errorMessage, setErrorMessage] = useState<string>();
  const [startedAt, setStartedAt] = useState(0);
  const conversation = useConversation({
    onConnect: () => setStatus("listening"),
    onDisconnect: (details) => {
      if (details.reason === "error") {
        const mappedMessage = mapElevenLabsError(details.message);
        setErrorMessage(mappedMessage);
        setStatus("error");
      } else {
        setStatus((current) => current === "error" ? current : "ended");
      }
    },
    onModeChange: ({ mode }) => setStatus(mode),
    onMessage: (message) => {
      const at = (Date.now() - startedAt) / 1000;
      setTranscript((entries) => [...entries, mapElevenLabsMessage(message, at, entries.length)]);
    },
    onError: (message) => {
      const mappedMessage = mapElevenLabsError(message);
      setErrorMessage(mappedMessage);
      setStatus("error");
    },
  });
  const { endSession, getInputVolume, getOutputVolume, startSession } = conversation;

  const start = useCallback(() => {
    setStartedAt(Date.now());
    setElapsedSeconds(0);
    setTranscript([]);
    setErrorMessage(undefined);
    setStatus("connecting");
    try {
      startSession();
    } catch (error) {
      const mappedMessage = mapElevenLabsError(error instanceof Error ? error.message : String(error));
      setErrorMessage(mappedMessage);
      setStatus("error");
    }
  }, [startSession]);

  const end = useCallback(() => {
    endSession();
    setStatus("ended");
  }, [endSession]);

  const fail = useCallback((message: string) => {
    endSession();
    setErrorMessage(message);
    setStatus("error");
  }, [endSession]);

  useEffect(() => {
    if (status === "consent" || status === "ended" || status === "error") return;
    const timer = setInterval(() => {
      setElapsedSeconds((Date.now() - startedAt) / 1000);
      setVolumes({ input: getInputVolume(), output: getOutputVolume() });
    }, 100);
    return () => {
      clearInterval(timer);
    };
  }, [getInputVolume, getOutputVolume, startedAt, status]);

  useEffect(() => () => endSession(), [endSession]);

  return children({
    status,
    transcript,
    elapsedSeconds,
    inputVolume: volumes.input,
    outputVolume: volumes.output,
    errorMessage,
    start,
    end,
    fail,
  });
}

export default function ElevenLabsCallSession({
  agentId,
  children,
}: {
  agentId: string;
  children: (session: CallSession) => React.ReactNode;
}) {
  return (
    <ConversationProvider agentId={agentId} connectionType="webrtc">
      <ElevenLabsSession>{children}</ElevenLabsSession>
    </ConversationProvider>
  );
}
