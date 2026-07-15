import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/layout/footer";
import { salon, siteCopy } from "@/content/salon";
import Home from "@/app/page";

describe("Home", () => {
  it("renders sections in the documented order with the correct ids", () => {
    const { container } = render(<Home />);
    const sections = Array.from(container.querySelectorAll("section"));

    expect(sections.map((section) => section.id)).toEqual(
      siteCopy.sections.map((section) => section.id),
    );
    siteCopy.sections.forEach((section, index) => {
      expect(
        within(sections[index]).getByRole("heading", { name: section.heading }),
      ).toBeInTheDocument();
    });
  });

  it("renders the standing demo disclaimer in the footer", () => {
    render(<Footer />);

    expect(screen.getByText(salon.disclaimer)).toBeInTheDocument();
  });
});
