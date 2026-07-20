export type CallStatus =
  | "consent"
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
  start(): void;
  end(): void;
  fail(message: string): void;
}
