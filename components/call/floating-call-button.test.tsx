import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CallProvider, useCall } from "@/components/call/call-provider";
import { FloatingCallButton } from "@/components/call/floating-call-button";
import { callCopy, contactCopy } from "@/content";

let intersectionCallback: IntersectionObserverCallback;

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
      <section id="hero" />
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
    vi.stubGlobal("IntersectionObserver", class IntersectionObserverStub {
      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }

      disconnect() {}
      observe() {}
    });
  });

  it('opens the call experience with the "floating" source', () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: contactCopy.floatingCallButtonAccessibleName }));
    expect(screen.getByText("floating")).toBeInTheDocument();
  });

  it("uses an icon-only mobile presentation while keeping its accessible name", () => {
    renderButton();
    const button = screen.getByRole("button", { name: contactCopy.floatingCallButtonAccessibleName });
    expect(button).not.toHaveAttribute("data-expanded");
    expect(button).toHaveAccessibleName(contactCopy.floatingCallButtonAccessibleName);
    expect(button).toHaveTextContent(contactCopy.floatingCallButtonLabel);
    expect(button.querySelector("[data-visible]")).not.toBeInTheDocument();
    expect(screen.getByText(contactCopy.floatingCallButtonLabel)).toHaveClass("hidden", "md:inline");
  });

  it("hides on mobile while the hero is visible and shows after it leaves view", () => {
    renderButton();
    const button = screen.getByRole("button", { name: contactCopy.floatingCallButtonAccessibleName });
    expect(button).toHaveClass("hidden", "md:flex");

    act(() => intersectionCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));

    expect(button).toHaveClass("flex");
    expect(button).not.toHaveClass("hidden");
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
    expect(liveButton).toHaveClass("flex");

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
