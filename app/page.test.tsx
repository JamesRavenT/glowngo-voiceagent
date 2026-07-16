import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Footer } from "@/components/layout/footer";
import { about, branches, salon, services, servicesCopy, siteCopy, stylists } from "@/content";
import Home from "@/app/page";
import { CallProvider } from "@/components/call/call-provider";

afterEach(cleanup);

const renderHome = () => render(<CallProvider><Home /></CallProvider>);

describe("Home", () => {
  it("renders sections in the documented order with the correct ids", () => {
    const { container } = renderHome();
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
    renderHome();

    const heading = screen.getByRole("heading", { level: 1, name: salon.tagline });
    const lines = Array.from(heading.children);

    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.textContent)).toEqual(salon.heroHeadlineLines);
    expect(salon.heroHeadlineLines.join(" ")).toBe(salon.tagline);
  });

  it("renders the standing demo disclaimer in the hero", () => {
    renderHome();

    const hero = screen.getByRole("region", { name: salon.tagline });
    expect(within(hero).getByText(salon.disclaimer)).toBeInTheDocument();
  });

  it("renders every About paragraph", () => {
    renderHome();

    about.paragraphs.forEach((paragraph) => {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    });
  });

  it("renders all services and surfaces consultation requirements from data", () => {
    const { container } = renderHome();

    expect(container.querySelectorAll("[data-service-id]")).toHaveLength(services.length);
    const consultationService = services.find(
      (service) => "requiresConsultation" in service && service.requiresConsultation,
    );
    const row = container.querySelector(`[data-service-id="${consultationService?.id}"]`);
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText(servicesCopy.consultationRequired)).toBeInTheDocument();
  });

  it("renders every branch's contact details and grouped hours without stylist rosters", () => {
    const { container } = renderHome();

    expect(container.querySelectorAll("[data-branch-id]")).toHaveLength(branches.length);
    expect(container.querySelectorAll("[data-stylist-id]")).toHaveLength(0);
    branches.forEach((branch) => {
      const article = container.querySelector(`[data-branch-id="${branch.id}"]`);
      expect(article).not.toBeNull();
      expect(within(article as HTMLElement).getByRole("heading", { name: branch.name })).toBeInTheDocument();
      expect(within(article as HTMLElement).getByText(branch.address)).toBeInTheDocument();
      expect(within(article as HTMLElement).getByRole("link", { name: branch.phone })).toBeInTheDocument();
      expect(within(article as HTMLElement).getByText(/Tue–Sat 9–7 · Sun 10–5 · Mon closed/)).toBeInTheDocument();
    });
    stylists.forEach((stylist) => expect(screen.queryByText(stylist.name)).not.toBeInTheDocument());
  });

  it("renders only the copyright in the footer", () => {
    render(<Footer />);

    expect(screen.getByText(siteCopy.footerCopyright)).toBeInTheDocument();
    expect(screen.queryByText(salon.disclaimer)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
