import { Section } from "@/components/layout/section";
import { About } from "@/components/sections/about";
import { Hero } from "@/components/sections/hero";
import { Locations } from "@/components/sections/locations";
import { Services } from "@/components/sections/services";
import { siteCopy } from "@/content/salon";

export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <About />
      <Services />
      <Locations />
      {siteCopy.sections.slice(4).map((section) => (
        <Section
          key={section.id}
          id={section.id}
          heading={section.heading}
        />
      ))}
    </main>
  );
}
