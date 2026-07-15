import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CallProvider, useCall } from "@/components/call/call-provider";
import { FloatingCallButton } from "@/components/call/floating-call-button";
import { contactCopy } from "@/content";

function CallState() {
  const { source } = useCall();
  return <output>{source ?? "closed"}</output>;
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
    fireEvent.click(screen.getByRole("button", { name: contactCopy.floatingCallButton }));
    expect(screen.getByText("floating")).toBeInTheDocument();
  });

  it("keeps its accessible name when expanded and collapsed", () => {
    renderButton();
    const button = screen.getByRole("button", { name: contactCopy.floatingCallButton });
    expect(button).toHaveAttribute("data-expanded", "true");

    window.scrollY = 100;
    fireEvent.scroll(window);

    expect(button).toHaveAttribute("data-expanded", "false");
    expect(button).toHaveAccessibleName(contactCopy.floatingCallButton);
    expect(button.querySelector("[data-visible='false']")).toBeInTheDocument();
  });

  it("disables the heartbeat pulse when reduced motion is preferred", () => {
    setReducedMotion(true);
    renderButton();
    const button = screen.getByRole("button", { name: contactCopy.floatingCallButton });
    expect(button).toHaveAttribute("data-pulse", "false");
    expect(button).not.toHaveClass("floating-call-button--pulse");
  });
});
