import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CallModal } from "@/components/call/call-modal";
import { CallProvider, useCall } from "@/components/call/call-provider";
import type { CallSession } from "@/components/call/call-session";

vi.mock("@/components/ui/live-waveform", () => ({ LiveWaveform: () => <div data-testid="waveform" /> }));

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
    end: vi.fn(),
    ...overrides,
  };
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

  it("ends the session from the end-call control", () => {
    const session = makeSession();
    renderModal(session);
    fireEvent.click(screen.getByRole("button", { name: "Floating call" }));
    fireEvent.click(screen.getByRole("button", { name: "End call" }));
    expect(session.end).toHaveBeenCalledOnce();
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
