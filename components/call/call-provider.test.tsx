import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CallProvider, useCall } from "@/components/call/call-provider";

afterEach(cleanup);

function Consumer() {
  const { isOpen, source, open, close } = useCall();
  return <><output>{isOpen ? `open:${source}` : "closed"}</output><button onClick={() => open("contact")}>Open contact</button><button onClick={() => open("floating")}>Open floating</button><button onClick={close}>Close</button></>;
}

describe("CallProvider", () => {
  it("opens with its trigger source and closes", () => {
    render(<CallProvider><Consumer /></CallProvider>);
    expect(screen.getByText("closed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open contact" }));
    expect(screen.getByText("open:contact")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open floating" }));
    expect(screen.getByText("open:floating")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByText("closed")).toBeInTheDocument();
  });

  it("throws a clear error outside the provider", () => {
    expect(() => render(<Consumer />)).toThrow("useCall must be used within a CallProvider");
  });
});
