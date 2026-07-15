import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Faq } from "@/components/sections/faq";
import { faq } from "@/content";

afterEach(cleanup);

describe("Faq", () => {
  it("renders all items and opens the honesty answer by default", () => {
    const { container } = render(<Faq />);
    expect(container.querySelectorAll("[data-faq-id]")).toHaveLength(faq.length);
    expect(screen.getByRole("button", { name: "Is this a real salon?" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Is this a real salon?" })).toBeVisible();
  });
});
