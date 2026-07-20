import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CallProvider, useCall } from "@/components/call/call-provider";
import { FloatingCallButton } from "@/components/call/floating-call-button";
import { callCopy, contactCopy } from "@/content";

function CallState() {
  const { isMinimized, minimize, source } = useCall();
  return <><output>{source ?? "closed"}</output><button type="button" onClick={minimize}>Minimize</button><span>{isMinimized ? "minimized" : "visible"}</span></>;
}

function setReducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function renderButton() {
  return render(
    <CallProvider>
      <FloatingCallButton />
      <CallState />
    </CallProvider>,
  );
}

describe("FloatingCallButton", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    setReducedMotion(false);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0, writable: true });
  });

  it('opens the call experience with the "floating" source', () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: contactCopy.floatingCallButtonAccessibleName }));
    expect(screen.getByText("floating")).toBeInTheDocument();
  });

  it("keeps its accessible name when expanded and collapsed", () => {
    renderButton();
    const button = screen.getByRole("button", { name: contactCopy.floatingCallButtonAccessibleName });
    expect(button).toHaveAttribute("data-expanded", "true");

    window.scrollY = 100;
    fireEvent.scroll(window);

    expect(button).toHaveAttribute("data-expanded", "false");
    expect(button).toHaveAccessibleName(contactCopy.floatingCallButtonAccessibleName);
    expect(button).toHaveTextContent(contactCopy.floatingCallButtonLabel);
    expect(button.querySelector("[data-visible='false']")).toBeInTheDocument();
  });

  it("disables the heartbeat pulse when reduced motion is preferred", () => {
    setReducedMotion(true);
    renderButton();
    const button = screen.getByRole("button", { name: contactCopy.floatingCallButtonAccessibleName });
    expect(button).toHaveAttribute("data-pulse", "false");
    expect(button).not.toHaveClass("floating-call-button--pulse");
  });

  it("morphs into a focused live-call button that restores instead of opening a new call", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: contactCopy.floatingCallButtonAccessibleName }));
    fireEvent.click(screen.getByRole("button", { name: "Minimize" }));

    const liveButton = screen.getByRole("button", { name: callCopy.minimizedCallButtonAccessibleName });
    expect(liveButton).toHaveFocus();
    expect(liveButton).toHaveAttribute("data-live", "true");
    expect(liveButton).not.toHaveAttribute("data-expanded");

    window.scrollY = 100;
    fireEvent.scroll(window);
    expect(liveButton).not.toHaveAttribute("data-expanded");

    fireEvent.click(liveButton);
    expect(screen.getByText("visible")).toBeInTheDocument();
    expect(screen.getByText("floating")).toBeInTheDocument();
  });

  it("keeps the rotating indicators static under reduced motion", () => {
    setReducedMotion(true);
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: contactCopy.floatingCallButtonAccessibleName }));
    fireEvent.click(screen.getByRole("button", { name: "Minimize" }));

    const liveButton = screen.getByRole("button", { name: callCopy.minimizedCallButtonAccessibleName });
    expect(liveButton).toHaveAttribute("data-pulse", "false");
    expect(liveButton.querySelectorAll("[style*='rotate']")).toHaveLength(0);
  });
});
