import { Section } from "@/components/layout/section";
import { about } from "@/content";

export function About() {
  return (
    <Section
      id="about"
      data-snap-panel
      aria-labelledby="about-heading"
      className="nocturne-panel h-[100svh] border-b border-gold-lo/30 px-5 pb-7 pt-20 sm:px-10 sm:pb-10 sm:pt-24 lg:px-[6vw] lg:py-[10vh]"
    >
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center gap-5 lg:relative lg:block">
        <div className="about-orbit flex shrink-0 flex-col justify-center lg:absolute lg:left-[3%] lg:top-[10%] lg:h-[72%] lg:w-[45%] lg:px-[4vw] lg:text-center">
          <p className="font-utility text-[0.65rem] font-medium uppercase tracking-[0.22em] text-copper">
            {about.heading}
          </p>
          <h2 id="about-heading" aria-label={about.heading} className="mt-2 max-w-[20ch] font-display text-[2.35rem] font-normal leading-[0.92] tracking-[-0.045em] text-cream sm:text-6xl lg:mx-auto lg:text-[clamp(3.2rem,5.4vw,5.5rem)]">
            {about.lead}
          </h2>
        </div>
        <div className="flex flex-col gap-4 text-[0.79rem] leading-[1.42] text-muted sm:text-base lg:absolute lg:inset-y-[7%] lg:left-[54%] lg:right-[2%] lg:justify-around lg:gap-6 lg:text-[clamp(0.9rem,1.25vw,1.15rem)] lg:leading-relaxed">
          {about.paragraphs.map((paragraph, index) => (
            <p key={paragraph} className={`border-l border-copper/70 pl-4 lg:pl-[2vw] ${index === 1 ? "lg:translate-x-[6vw]" : ""}`}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}
