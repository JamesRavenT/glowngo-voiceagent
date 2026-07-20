import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CallProvider, useCall } from "@/components/call/call-provider";
import { CallSessionSelector } from "@/components/call/call-session-selector";

const sessionCleanup = vi.fn();

vi.mock("@/components/call/simulated-call-session", () => ({
  useSimulatedCallSession: () => {
    useEffect(() => sessionCleanup, []);
    return {
      status: "speaking" as const,
      transcript: [],
      elapsedSeconds: 0,
      inputVolume: 0,
      outputVolume: 0,
      start: vi.fn(),
      end: vi.fn(),
      fail: vi.fn(),
    };
  },
}));

vi.mock("@/components/call/call-modal", () => ({
  CallModal: () => {
    const { minimize } = useCall();
    return <button type="button" onClick={minimize}>Minimize session</button>;
  },
}));

function OpenButton() {
  const { open } = useCall();
  return <button type="button" onClick={() => open("floating")}>Open session</button>;
}

describe("CallSessionSelector", () => {
  afterEach(() => {
    cleanup();
    sessionCleanup.mockClear();
  });

  it("keeps the session mounted while the call is minimized", () => {
    render(<CallProvider><OpenButton /><CallSessionSelector /></CallProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Open session" }));
    fireEvent.click(screen.getByRole("button", { name: "Minimize session" }));

    expect(sessionCleanup).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Minimize session" })).toBeInTheDocument();
  });
});
