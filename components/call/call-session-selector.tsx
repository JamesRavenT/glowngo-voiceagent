"use client";

import dynamic from "next/dynamic";

import { CallModal } from "@/components/call/call-modal";
import { useCall } from "@/components/call/call-provider";
import { useSimulatedCallSession } from "@/components/call/simulated-call-session";
import { publicEnv } from "@/lib/env";

const ElevenLabsCallSession = dynamic(() => import("@/components/call/elevenlabs-call-session"), { ssr: false });

function SimulatedSession() {
  const session = useSimulatedCallSession();
  return <CallModal session={session} mode="simulated" />;
}

export function CallSessionSelector() {
  const { hasSession } = useCall();
  if (!hasSession) return null;

  if (publicEnv.agentMode === "live" && publicEnv.elevenLabsAgentId) {
    return (
      <ElevenLabsCallSession agentId={publicEnv.elevenLabsAgentId}>
        {(session) => <CallModal session={session} mode="live" />}
      </ElevenLabsCallSession>
    );
  }

  return <SimulatedSession />;
}
