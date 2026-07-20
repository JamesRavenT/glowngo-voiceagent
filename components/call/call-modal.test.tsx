import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CallModal } from "@/components/call/call-modal";
import { CallProvider, useCall } from "@/components/call/call-provider";
import type { CallSession } from "@/components/call/call-session";
import { FloatingCallButton } from "@/components/call/floating-call-button";
import { Transcript } from "@/components/call/transcript";
import { callCopy, salon } from "@/content";
import { publicEnv } from "@/lib/env";

vi.mock("@/components/ui/live-waveform", () => ({ LiveWaveform: () => <div data-testid="waveform" /> }));

class AudioStub {
  static instances: AudioStub[] = [];
  currentTime = 0;
  loop = false;
  volume = 1;
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

function StatefulSession({ mode }: { mode: "live" | "simulated" }) {
  const [session, setSession] = useState<CallSession>(() => makeSession({
    status: "consent",
    elapsedSeconds: 0,
    transcript: [],
  }));
  const start = () => setSession((current) => ({ ...current, status: "connecting", start, end, fail }));
  const end = () => setSession((current) => ({ ...current, status: "ended", start, end, fail }));
  const fail = (message: string) => setSession((current) => ({ ...current, status: "error", errorMessage: message, start, end, fail }));
  return <CallModal session={{ ...session, start, end, fail }} mode={mode} />;
}

function renderModal(session = makeSession()) {
  return render(
    <CallProvider>
      <Triggers />
      <FloatingCallButton />
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
    expect(screen.getByText("How can I help?")).toBeInTheDocument();
    expect(screen.getByText("A haircut, please.")).toBeInTheDocument();
    const transcript = screen.getByLabelText("Call transcript");
    expect(transcript).toHaveTextContent("Agent says: How can I help?");
    expect(transcript).toHaveTextContent("Caller says: A haircut, please.");
    expect(transcript).toHaveAttribute("aria-live", "polite");
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
    expect(screen.getByRole("heading", { name: callCopy.consentHeading })).toBeVisible();
    expect(screen.getByText(salon.disclaimer)).toBeVisible();
    expect(screen.getByText(callCopy.publicBookingWarning)).toBeVisible();
    expect(screen.getByRole("button", { name: callCopy.startCallButton })).toHaveFocus();
    expect(document.querySelector('[data-call-state="consent"]')).toHaveClass("text-center");
  });

  it("centers only the consent content", () => {
    const { rerender } = render(
      <CallProvider><Triggers /><CallModal session={makeSession({ status: "consent", transcript: [] })} /></CallProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));
    expect(document.querySelector('[data-call-state="consent"]')).toHaveClass("text-center");

    rerender(<CallProvider><Triggers /><CallModal session={makeSession()} /></CallProvider>);
    expect(screen.getByLabelText("Call transcript")).not.toHaveClass("text-center");
  });

  it("stops a live connecting attempt at 20 seconds and shows the connection error", () => {
    vi.useFakeTimers();
    render(<CallProvider><Triggers /><StatefulSession mode="live" /></CallProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));
    fireEvent.click(screen.getByRole("button", { name: callCopy.startCallButton }));

    expect(AudioStub.instances[0]?.src).toBe("/audio/ring.wav");
    expect(AudioStub.instances[0]?.loop).toBe(true);
    expect(AudioStub.instances[0]?.volume).toBe(0.5);
    act(() => vi.advanceTimersByTime(20_000));

    expect(screen.getByRole("alert")).toHaveTextContent(callCopy.connectionError);
    expect(AudioStub.instances[0]?.pause).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("does not fail a simulated connecting attempt after the live connection timeout", () => {
    vi.useFakeTimers();
    render(<CallProvider><Triggers /><StatefulSession mode="simulated" /></CallProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));
    fireEvent.click(screen.getByRole("button", { name: callCopy.startCallButton }));

    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByText("Connecting")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(AudioStub.instances[0]?.pause).not.toHaveBeenCalled();
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

  it.each(["consent", "ended", "error"] as const)("Escape closes the modal and restores focus when status is %s", (status) => {
    renderModal(makeSession({ status }));
    const trigger = screen.getByRole("button", { name: "Contact call" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");

    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("button", { name: callCopy.minimizedCallButtonAccessibleName })).not.toBeInTheDocument();
  });

  it.each(["Escape", "backdrop", "close button"])("minimizes a live call from the %s and focuses the call bubble", (gesture) => {
    const session = makeSession();
    renderModal(session);
    const trigger = screen.getByRole("button", { name: "Contact call" });
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");

    if (gesture === "Escape") {
      fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    } else if (gesture === "backdrop") {
      fireEvent.click(dialog);
    } else {
      fireEvent.click(screen.getByRole("button", { name: callCopy.closeButton }));
    }

    expect(dialog).not.toHaveAttribute("open");
    expect(screen.getByRole("button", { name: callCopy.minimizedCallButtonAccessibleName })).toHaveFocus();
    expect(screen.getByText(callCopy.minimizedCallAnnouncement)).toHaveAttribute("role", "status");
    expect(session.end).not.toHaveBeenCalled();
  });

  it.each(["Escape", "backdrop", "close button"])("closes an unaccepted consent screen from the %s", (gesture) => {
    renderModal(makeSession({ status: "consent" }));
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));
    const dialog = screen.getByRole("dialog");

    if (gesture === "Escape") {
      fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    } else if (gesture === "backdrop") {
      fireEvent.click(dialog);
    } else {
      fireEvent.click(screen.getByRole("button", { name: callCopy.closeButton }));
    }

    expect(dialog).not.toHaveAttribute("open");
    expect(screen.queryByRole("button", { name: callCopy.minimizedCallButtonAccessibleName })).not.toBeInTheDocument();
  });

  it("reopens a minimized call and moves focus into the dialog", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Contact call" }));
    const dialog = screen.getByRole("dialog");
    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));

    fireEvent.click(screen.getByRole("button", { name: callCopy.minimizedCallButtonAccessibleName }));

    expect(dialog).toHaveAttribute("open");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("reveals agent messages progressively but shows caller messages immediately", () => {
    vi.useFakeTimers();
    const endRef = { current: null };
    const entries = [
      { id: "agent", speaker: "agent" as const, text: "This agent response takes several words to reveal.", at: 1 },
      { id: "caller", speaker: "caller" as const, text: "Caller text is immediate.", at: 2 },
    ];
    const { rerender } = render(<Transcript entries={entries.slice(0, 1)} status="speaking" reducedMotion={false} endRef={endRef} />);
    const agentText = document.querySelector('[data-transcript-entry="agent"] [data-revealed-text]')!;
    expect(agentText).toHaveTextContent("");
    act(() => vi.advanceTimersByTime(300));
    expect(agentText.textContent!.length).toBeGreaterThan(0);
    expect(agentText).not.toHaveTextContent(entries[0].text);

    rerender(<Transcript entries={entries} status="listening" reducedMotion={false} endRef={endRef} />);
    expect(agentText).toHaveTextContent(entries[0].text);
    expect(document.querySelector('[data-transcript-entry="caller"] [data-revealed-text]')).toHaveTextContent(entries[1].text);
    vi.useRealTimers();
  });

  it("completes an in-progress reveal when the next message arrives", () => {
    vi.useFakeTimers();
    const endRef = { current: null };
    const first = { id: "first", speaker: "agent" as const, text: "The first message is deliberately long enough to remain in progress.", at: 1 };
    const second = { id: "second", speaker: "agent" as const, text: "A newer reply.", at: 2 };
    const { rerender } = render(<Transcript entries={[first]} status="speaking" reducedMotion={false} endRef={endRef} />);
    act(() => vi.advanceTimersByTime(200));

    rerender(<Transcript entries={[first, second]} status="speaking" reducedMotion={false} endRef={endRef} />);
    expect(document.querySelector('[data-transcript-entry="first"] [data-revealed-text]')).toHaveTextContent(first.text);
    expect(document.querySelector('[data-transcript-entry="second"] [data-revealed-text]')).toHaveTextContent("");
    vi.useRealTimers();
  });

  it.each(["ended", "error"] as const)("flushes all reveals in the %s state", (status) => {
    vi.useFakeTimers();
    const endRef = { current: null };
    const entry = { id: "reference", speaker: "agent" as const, text: "Your booking reference is G-G-4-8-2-1.", at: 1 };
    const { rerender } = render(<Transcript entries={[entry]} status="speaking" reducedMotion={false} endRef={endRef} />);
    act(() => vi.advanceTimersByTime(100));

    rerender(<Transcript entries={[entry]} status={status} reducedMotion={false} endRef={endRef} />);
    expect(document.querySelector('[data-revealed-text]')).toHaveTextContent(entry.text);
    vi.useRealTimers();
  });

  it("renders full agent text immediately with reduced motion", () => {
    const entry = { id: "agent", speaker: "agent" as const, text: "No animated reveal.", at: 1 };
    render(<Transcript entries={[entry]} status="speaking" reducedMotion endRef={{ current: null }} />);
    expect(document.querySelector('[data-revealed-text]')).toHaveTextContent(entry.text);
  });

  it("announces each complete message once without updating the live text per reveal tick", () => {
    vi.useFakeTimers();
    const entry = { id: "agent", speaker: "agent" as const, text: "A complete accessible announcement.", at: 1 };
    render(<Transcript entries={[entry]} status="speaking" reducedMotion={false} endRef={{ current: null }} />);
    const liveRegion = screen.getByLabelText("Call transcript");
    const announcementLayer = liveRegion.querySelector(".sr-only")!;
    const observer = new MutationObserver(vi.fn());
    observer.observe(announcementLayer, { childList: true, characterData: true, subtree: true });

    expect(announcementLayer.children).toHaveLength(1);
    expect(announcementLayer).toHaveTextContent(`Agent says: ${entry.text}`);
    act(() => vi.advanceTimersByTime(500));
    expect(observer.takeRecords()).toHaveLength(0);
    expect(announcementLayer.children).toHaveLength(1);
    observer.disconnect();
    vi.useRealTimers();
  });
});
