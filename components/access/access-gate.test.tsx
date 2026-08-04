import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccessGate } from "@/components/access/access-gate";
import { accessCopy } from "@/content";

const accessMocks = vi.hoisted(() => ({
  parseAccessProjectId: vi.fn(),
  readStoredKey: vi.fn(),
  writeStoredKey: vi.fn(),
  clearStoredKey: vi.fn(),
  verifyAccessKey: vi.fn(),
}));

vi.mock("@/lib/access-gate/env", () => ({
  rawAccessProjectId: undefined,
  parseAccessProjectId: accessMocks.parseAccessProjectId,
}));

vi.mock("@/lib/access-gate/storage", () => ({
  readStoredKey: accessMocks.readStoredKey,
  writeStoredKey: accessMocks.writeStoredKey,
  clearStoredKey: accessMocks.clearStoredKey,
}));

vi.mock("@/lib/access-gate/verify", () => ({
  verifyAccessKey: accessMocks.verifyAccessKey,
}));

const projectId = "12345678-1234-1234-1234-123456789abc";

function renderGate(node = <p>Private site content</p>) {
  return render(<AccessGate>{node}</AccessGate>);
}

describe("AccessGate", () => {
  beforeEach(() => {
    accessMocks.parseAccessProjectId.mockReset().mockReturnValue(projectId);
    accessMocks.readStoredKey.mockReset().mockReturnValue(null);
    accessMocks.writeStoredKey.mockReset();
    accessMocks.clearStoredKey.mockReset();
    accessMocks.verifyAccessKey.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("shows the gate without checking the network when no key is stored", async () => {
    renderGate();

    expect(await screen.findByRole("heading", { name: accessCopy.heading })).toBeInTheDocument();
    expect(accessMocks.verifyAccessKey).not.toHaveBeenCalled();
    expect(screen.queryByText("Private site content")).not.toBeInTheDocument();
  });

  it("shows only checking before a stored valid key unlocks the site", async () => {
    let resolveVerification!: (outcome: { status: "valid" }) => void;
    accessMocks.readStoredKey.mockReturnValue("GG-4821");
    accessMocks.verifyAccessKey.mockReturnValue(new Promise((resolve) => {
      resolveVerification = resolve;
    }));

    renderGate();

    expect(screen.getByRole("status")).toHaveTextContent(accessCopy.checking);
    expect(screen.queryByLabelText(accessCopy.inputLabel)).not.toBeInTheDocument();
    expect(screen.queryByText("Private site content")).not.toBeInTheDocument();

    resolveVerification({ status: "valid" });

    expect(await screen.findByText("Private site content")).toBeInTheDocument();
    expect(screen.queryByLabelText(accessCopy.inputLabel)).not.toBeInTheDocument();
  });

  it("clears an invalid stored key and explains that it expired", async () => {
    accessMocks.readStoredKey.mockReturnValue("GG-OLD1");
    accessMocks.verifyAccessKey.mockResolvedValue({ status: "invalid" });

    renderGate();

    expect(await screen.findByText(accessCopy.expired)).toBeInTheDocument();
    expect(screen.queryByText(accessCopy.invalid)).not.toBeInTheDocument();
    expect(accessMocks.clearStoredKey).toHaveBeenCalledOnce();
  });

  it("keeps an unavailable stored key and offers retry", async () => {
    accessMocks.readStoredKey.mockReturnValue("GG-4821");
    accessMocks.verifyAccessKey.mockResolvedValue({ status: "unavailable" });

    renderGate();

    expect(await screen.findByText(accessCopy.unavailable)).toBeInTheDocument();
    expect(accessMocks.clearStoredKey).not.toHaveBeenCalled();
    expect(screen.queryByText("Private site content")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: accessCopy.retryButton })).toBeInTheDocument();
  });

  it("reuses a stored key when retrying after an outage", async () => {
    accessMocks.readStoredKey.mockReturnValue("GG-4821");
    accessMocks.verifyAccessKey
      .mockResolvedValueOnce({ status: "unavailable" })
      .mockResolvedValueOnce({ status: "valid" });

    renderGate();
    fireEvent.click(await screen.findByRole("button", { name: accessCopy.retryButton }));

    expect(await screen.findByText("Private site content")).toBeInTheDocument();
    expect(accessMocks.verifyAccessKey).toHaveBeenCalledTimes(2);
    expect(accessMocks.verifyAccessKey).toHaveBeenNthCalledWith(2, "GG-4821", projectId);
  });

  it("normalises and stores a fresh valid key", async () => {
    accessMocks.verifyAccessKey.mockResolvedValue({ status: "valid" });
    renderGate();
    const input = await screen.findByLabelText(accessCopy.inputLabel);

    fireEvent.change(input, { target: { value: "  gg-4821  " } });
    fireEvent.click(screen.getByRole("button", { name: accessCopy.submitButton }));

    expect(await screen.findByText("Private site content")).toBeInTheDocument();
    expect(accessMocks.verifyAccessKey).toHaveBeenCalledWith("GG-4821", projectId);
    expect(accessMocks.writeStoredKey).toHaveBeenCalledWith("GG-4821");
  });

  it("keeps the form usable after a fresh invalid key", async () => {
    accessMocks.verifyAccessKey.mockResolvedValue({ status: "invalid" });
    renderGate();
    const input = await screen.findByLabelText(accessCopy.inputLabel);

    fireEvent.change(input, { target: { value: "wrong-key" } });
    fireEvent.click(screen.getByRole("button", { name: accessCopy.submitButton }));

    expect(await screen.findByText(accessCopy.invalid)).toBeInTheDocument();
    expect(accessMocks.clearStoredKey).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveFocus();
    expect(screen.getByRole("button", { name: accessCopy.submitButton })).toBeEnabled();
  });

  it("disables attempts while rate limited and announces the countdown outside the alert", async () => {
    accessMocks.verifyAccessKey.mockResolvedValue({ status: "rate-limited", retryAfterSeconds: 30 });
    renderGate();
    const input = await screen.findByLabelText(accessCopy.inputLabel);

    fireEvent.change(input, { target: { value: "GG-4821" } });
    fireEvent.click(screen.getByRole("button", { name: accessCopy.submitButton }));

    const countdown = await screen.findByRole("status");
    const alert = screen.getByRole("alert");
    expect(countdown).toHaveTextContent("30 seconds");
    expect(alert).not.toContainElement(countdown);
    expect(alert).not.toHaveTextContent("30 seconds");
    expect(screen.getByRole("button", { name: accessCopy.submitButton })).toBeDisabled();
    expect(screen.getByRole("button", { name: accessCopy.retryButton })).toBeDisabled();
  });

  it("shows a configuration fault without verifying when the project id is invalid", async () => {
    const configurationError = new Error("invalid project configuration");
    accessMocks.parseAccessProjectId.mockImplementation(() => {
      throw configurationError;
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderGate();

    expect(await screen.findByText(accessCopy.misconfigured)).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(configurationError);
    expect(accessMocks.verifyAccessKey).not.toHaveBeenCalled();
    expect(screen.queryByText("Private site content")).not.toBeInTheDocument();
    expect(screen.getByLabelText(accessCopy.inputLabel)).toBeDisabled();
    expect(screen.getByRole("button", { name: accessCopy.submitButton })).toBeDisabled();
  });

  it("checks a stored key exactly once in StrictMode and settles", async () => {
    accessMocks.readStoredKey.mockReturnValue("GG-4821");
    accessMocks.verifyAccessKey.mockResolvedValue({ status: "valid" });

    render(
      <StrictMode>
        <AccessGate><p>Private site content</p></AccessGate>
      </StrictMode>,
    );

    expect(await screen.findByText("Private site content")).toBeInTheDocument();
    await waitFor(() => expect(accessMocks.verifyAccessKey).toHaveBeenCalledOnce());
    expect(screen.queryByText(accessCopy.checking)).not.toBeInTheDocument();
  });
});
