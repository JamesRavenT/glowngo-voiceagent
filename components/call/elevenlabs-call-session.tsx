"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [transcript, setTranscript] = useState<readonly TranscriptEntry[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [volumes, setVolumes] = useState({ input: 0, output: 0 });
  const [errorMessage, setErrorMessage] = useState<string>();
  const startedAtRef = useRef(0);
  const transcriptCountRef = useRef(0);
  const conversation = useConversation({
    onMessage: (message) => {
      const at = (Date.now() - startedAtRef.current) / 1000;
      setTranscript((entries) => [...entries, mapElevenLabsMessage(message, at, transcriptCountRef.current++)]);
    },
    onError: (message) => setErrorMessage(mapElevenLabsError(message)),
  });
  const { endSession, getInputVolume, getOutputVolume, startSession } = conversation;

  const end = useCallback(() => endSession(), [endSession]);

  useEffect(() => {
    startedAtRef.current = Date.now();
    startSession();
    const timer = setInterval(() => {
      setElapsedSeconds((Date.now() - startedAtRef.current) / 1000);
      setVolumes({ input: getInputVolume(), output: getOutputVolume() });
    }, 100);
    return () => {
      clearInterval(timer);
      endSession();
    };
  }, [endSession, getInputVolume, getOutputVolume, startSession]);

  return children({
    status: errorMessage ? "error" : mapElevenLabsStatus(conversation.status, conversation.mode),
    transcript,
    elapsedSeconds,
    inputVolume: volumes.input,
    outputVolume: volumes.output,
    errorMessage,
    end,
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
