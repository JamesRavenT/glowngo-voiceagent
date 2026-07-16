import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CallProvider, useCall } from "@/components/call/call-provider";
import { HeroCallButton } from "@/components/sections/hero-call-button";
import { contactCopy } from "@/content";

afterEach(cleanup);

function SourceProbe() {
  const { source } = useCall();

  return <output>{source ?? "closed"}</output>;
}

describe("HeroCallButton", () => {
  it("opens the call modal from the hero with the voice-call context announced", () => {
    render(
      <CallProvider>
        <HeroCallButton />
        <SourceProbe />
      </CallProvider>,
    );

    const button = screen.getByRole("button", {
      name: contactCopy.floatingCallButtonAccessibleName,
    });

    expect(button).toHaveClass("md:hidden");
    expect(button).toHaveTextContent("Book Now");
    fireEvent.click(button);
    expect(screen.getByText("hero")).toBeInTheDocument();
  });
});
