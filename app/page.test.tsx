import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Footer } from "@/components/layout/footer";
import { about, salon, siteCopy } from "@/content";
import Home from "@/app/page";

afterEach(cleanup);

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

  it("renders the salon tagline as exactly two synchronized headline lines", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", { level: 1, name: salon.tagline });
    const lines = Array.from(heading.children);

    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.textContent)).toEqual(salon.heroHeadlineLines);
    expect(salon.heroHeadlineLines.join(" ")).toBe(salon.tagline);
  });

  it("renders every About paragraph", () => {
    render(<Home />);

    about.paragraphs.forEach((paragraph) => {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    });
  });

  it("renders the standing demo disclaimer in the footer", () => {
    render(<Footer />);

    expect(screen.getByText(salon.disclaimer)).toBeInTheDocument();
  });
});
