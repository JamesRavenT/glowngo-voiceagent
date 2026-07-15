import { Section } from "@/components/layout/section";
import { About } from "@/components/sections/about";
import { Hero } from "@/components/sections/hero";
import { siteCopy } from "@/content/salon";

export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <About />
      {siteCopy.sections.slice(2).map((section) => (
        <Section
          key={section.id}
          id={section.id}
          heading={section.heading}
        />
      ))}
    </main>
  );
}
