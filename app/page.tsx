import { Section } from "@/components/layout/section";
import { siteCopy } from "@/content/salon";

export default function Home() {
  return (
    <main id="main-content">
      {siteCopy.sections.map((section, index) => (
        <Section
          key={section.id}
          id={section.id}
          heading={section.heading}
          headingLevel={index === 0 ? 1 : 2}
        />
      ))}
    </main>
  );
}
