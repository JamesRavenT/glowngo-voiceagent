import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSimulatedCallSession } from "@/components/call/simulated-call-session";

describe("useSimulatedCallSession", () => {
  afterEach(() => vi.useRealTimers());

  it("advances through the ordered script and ends at 18 seconds", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSimulatedCallSession());
    act(() => vi.advanceTimersByTime(8000));
    expect(result.current.status).toBe("speaking");
    expect(result.current.transcript.map((entry) => entry.speaker)).toEqual(["agent", "caller", "agent"]);
    expect(result.current.outputVolume).toBeGreaterThan(result.current.inputVolume);

    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.status).toBe("ended");
    expect(result.current.elapsedSeconds).toBeCloseTo(18, 1);
    expect(result.current.transcript).toHaveLength(5);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans up its timer when ended", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSimulatedCallSession());
    expect(vi.getTimerCount()).toBe(1);
    act(() => result.current.end());
    expect(result.current.status).toBe("ended");
    expect(vi.getTimerCount()).toBe(0);
  });
});
