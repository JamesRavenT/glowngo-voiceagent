import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CallModal } from "@/components/call/call-modal";
import { CallProvider, useCall } from "@/components/call/call-provider";
import type { CallSession } from "@/components/call/call-session";
import { callCopy, salon } from "@/content";
import { publicEnv } from "@/lib/env";

vi.mock("@/components/ui/live-waveform", () => ({ LiveWaveform: () => <div data-testid="waveform" /> }));

class AudioStub {
  static instances: AudioStub[] = [];
  currentTime = 0;
  loop = false;
  pause = vi.fn();
  play = vi.fn().mockResolvedValue(undefined);
  removeAttribute = vi.fn();

  constructor(public src: string) {
    AudioStub.instances.push(this);
  }
}

function Triggers() {
  const { open } = useCall();
  return (
    <>
      <button type="button" onClick={() => open("contact")}>Contact call</button>
      <button type="button" onClick={() => open("floating")}>Floating call</button>
    </>
  );
}

function makeSession(overrides: Partial<CallSession> = {}): CallSession {
  return {
    status: "speaking",
    elapsedSeconds: 61,
    inputVolume: 0.2,
    outputVolume: 0.7,
    transcript: [
      { id: "one", speaker: "agent", text: "How can I help?", at: 1 },
      { id: "two", speaker: "caller", text: "A haircut, please.", at: 3 },
    ],
    start: vi.fn(),
    end: vi.fn(),
    fail: vi.fn(),
    ...overrides,
  };
}

function StatefulSession() {
  const [session, setSession] = useState<CallSession>(() => makeSession({
    status: "consent",
    elapsedSeconds: 0,
    transcript: [],
  }));
  const start = () => setSession((current) => ({ ...current, status: "connecting", start, end, fail }));
  const end = () => setSession((current) => ({ ...current, status: "ended", start, end, fail }));
  const fail = (message: string) => setSession((current) => ({ ...current, status: "error", errorMessage: message, start, end, fail }));
  return <CallModal session={{ ...session, start, end, fail }} />;
}

function renderModal(session = makeSession()) {
  return render(
    <CallProvider>
      <Triggers />
      <CallModal session={session} />
    </CallProvider>,
  );
}

describe("CallModal", () => {
  beforeEach(() => {
    AudioStub.instances = [];
    vi.stubGlobal("Audio", AudioStub);
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders session status, timer, transcript, and named speakers", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));

    expect(screen.getByText("Speaking")).toBeInTheDocument();
    expect(screen.getByText("01:01")).toBeInTheDocument();
    expect(screen.getByText("How can I help?")).toHaveTextContent("Agent says:");
    expect(screen.getByText("A haircut, please.")).toHaveTextContent("Caller says:");
    expect(screen.getByLabelText("Call transcript")).toHaveAttribute("aria-live", "polite");
  });

  it("reserves the explicit polite live region for the transcript", () => {
    const { container } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));

    const statusLabel = screen.getByText("Speaking");
    expect(statusLabel).toHaveAttribute("aria-live", "polite");

    const politeLiveRegions = container.querySelectorAll('[aria-live="polite"]');
    expect(politeLiveRegions).toHaveLength(2);
    expect(politeLiveRegions[1]).toBe(screen.getByLabelText("Call transcript"));
  });

  it("ends the session from the end-call control", () => {
    const session = makeSession();
    renderModal(session);
    fireEvent.click(screen.getByRole("button", { name: "Floating call" }));
    fireEvent.click(screen.getByRole("button", { name: "End call" }));
    expect(session.end).toHaveBeenCalledOnce();
  });

  it("opens at consent without starting and focuses the call button", () => {
    const session = makeSession({ status: "consent", elapsedSeconds: 0, transcript: [] });
    renderModal(session);
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));

    expect(session.start).not.toHaveBeenCalled();
    expect(screen.getByText(salon.disclaimer)).toBeVisible();
    expect(screen.getByText(callCopy.publicBookingWarning)).toBeVisible();
    expect(screen.getByRole("button", { name: callCopy.startCallButton })).toHaveFocus();
  });

  it("stops a connecting attempt at 20 seconds and shows the connection error", () => {
    vi.useFakeTimers();
    render(<CallProvider><Triggers /><StatefulSession /></CallProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));
    fireEvent.click(screen.getByRole("button", { name: callCopy.startCallButton }));

    expect(AudioStub.instances[0]?.src).toBe("/audio/ring.wav");
    expect(AudioStub.instances[0]?.loop).toBe(true);
    act(() => vi.advanceTimersByTime(20_000));

    expect(screen.getByRole("alert")).toHaveTextContent(callCopy.connectionError);
    expect(AudioStub.instances[0]?.pause).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("plays the end sound exactly once when ended re-renders", () => {
    const session = makeSession({ status: "ended" });
    const { rerender } = render(
      <CallProvider><Triggers /><CallModal session={session} /></CallProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));
    rerender(<CallProvider><Triggers /><CallModal session={{ ...session }} /></CallProvider>);

    const endSounds = AudioStub.instances.filter((audio) => audio.src === "/audio/end.wav");
    expect(endSounds).toHaveLength(1);
    expect(endSounds[0].play).toHaveBeenCalledOnce();
  });

  it("renders the bookings link in ended only when its URL exists", () => {
    const originalUrl = publicEnv.bookingSheetUrl;
    Object.defineProperty(publicEnv, "bookingSheetUrl", { configurable: true, value: "https://example.com/bookings" });
    const session = makeSession({ status: "ended" });
    const { unmount } = renderModal(session);
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));

    expect(screen.getByRole("link", { name: "Glow & Go Bookings" })).toHaveAttribute("href", "https://example.com/bookings");
    unmount();

    Object.defineProperty(publicEnv, "bookingSheetUrl", { configurable: true, value: undefined });
    renderModal(session);
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));
    expect(screen.getByText(callCopy.thankYou)).toBeVisible();
    expect(screen.queryByRole("link", { name: "Glow & Go Bookings" })).not.toBeInTheDocument();
    Object.defineProperty(publicEnv, "bookingSheetUrl", { configurable: true, value: originalUrl });
  });

  it("shows the persistent badge only in simulated mode", () => {
    const { rerender } = render(
      <CallProvider><Triggers /><CallModal session={makeSession()} mode="simulated" /></CallProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));
    expect(screen.getByText("Simulated preview — no live agent connected")).toBeVisible();

    rerender(<CallProvider><Triggers /><CallModal session={makeSession()} mode="live" /></CallProvider>);
    expect(screen.queryByText("Simulated preview — no live agent connected")).not.toBeInTheDocument();
  });

  it.each(["Contact call", "Floating call"])("opens from %s and returns focus after Escape", (triggerName) => {
    renderModal();
    const trigger = screen.getByRole("button", { name: triggerName });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("open");

    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
  });
});
