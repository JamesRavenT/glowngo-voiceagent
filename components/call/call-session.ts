export type CallStatus =
  | "connecting"
  | "listening"
  | "speaking"
  | "thinking"
  | "ended"
  | "error";

export type TranscriptEntry = {
  id: string;
  speaker: "agent" | "caller";
  text: string;
  at: number;
};

export interface CallSession {
  status: CallStatus;
  transcript: readonly TranscriptEntry[];
  elapsedSeconds: number;
  inputVolume: number;
  outputVolume: number;
  errorMessage?: string;
  end(): void;
}
