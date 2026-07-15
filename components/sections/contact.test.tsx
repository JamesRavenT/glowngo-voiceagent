import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CallProvider, useCall } from "@/components/call/call-provider";
import { Contact } from "@/components/sections/contact";
import { contactCopy, examplePhrases, services } from "@/content";

afterEach(cleanup);

function CallState() {
  const { isOpen, source } = useCall();
  return <output>{isOpen ? source : "closed"}</output>;
}

const renderContact = (bookingSheetUrl?: string) => render(<CallProvider><Contact bookingSheetUrl={bookingSheetUrl} /><CallState /></CallProvider>);

describe("Contact", () => {
  it("opens the call from the contact trigger", () => {
    renderContact();
    fireEvent.click(screen.getByRole("button", { name: contactCopy.callButton }));
    expect(screen.getByText("contact")).toBeInTheDocument();
  });

  it("renders every phrase and derives every quick-reference row", () => {
    const { container } = renderContact();
    examplePhrases.forEach((phrase) => expect(screen.getByText(`“${phrase}”`)).toBeInTheDocument());
    expect(container.querySelectorAll("[data-quick-service-id]")).toHaveLength(services.length);
  });

  it("renders a safe synthetic-data link when configured", () => {
    renderContact("https://example.com/demo-sheet");
    const link = screen.getByRole("link", { name: contactCopy.bookingSheetLink });
    expect(link).toHaveAttribute("href", "https://example.com/demo-sheet");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(contactCopy.bookingSheetDisclaimer)).toBeInTheDocument();
  });

  it("renders an honest note instead of a link when unconfigured", () => {
    renderContact();
    expect(screen.queryByRole("link", { name: contactCopy.bookingSheetLink })).not.toBeInTheDocument();
    expect(screen.getByText(contactCopy.bookingSheetUnavailable)).toBeInTheDocument();
  });
});
