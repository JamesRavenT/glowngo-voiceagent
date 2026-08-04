import { afterEach, describe, expect, it, vi } from "vitest";

import { clearStoredKey, readStoredKey, STORAGE_KEY, writeStoredKey } from "@/lib/access-gate/storage";

describe("access key storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("round trips a stored key", () => {
    writeStoredKey("GG-4821");
    expect(readStoredKey()).toBe("GG-4821");
  });

  it("clears a stored key", () => {
    window.localStorage.setItem(STORAGE_KEY, "GG-4821");
    clearStoredKey();
    expect(readStoredKey()).toBeNull();
  });

  it("returns null for a blank stored value", () => {
    window.localStorage.setItem(STORAGE_KEY, "   ");
    expect(readStoredKey()).toBeNull();
  });

  it("trims a stored key", () => {
    window.localStorage.setItem(STORAGE_KEY, "  GG-4821  ");
    expect(readStoredKey()).toBe("GG-4821");
  });

  it("does not propagate storage failures", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("storage disabled", "SecurityError");
    });

    expect(readStoredKey()).toBeNull();
    expect(() => writeStoredKey("GG-4821")).not.toThrow();
    expect(() => clearStoredKey()).not.toThrow();
  });
});

