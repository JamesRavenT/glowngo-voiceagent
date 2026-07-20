import Image from "next/image";

import { Section } from "@/components/layout/section";
import { HeroCallButton } from "@/components/sections/hero-call-button";
import { salon, siteCopy } from "@/content";

export function Hero() {
  return (
    <Section
      id="hero"
      data-snap-panel
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink px-6 pb-[clamp(4rem,10svh,7rem)] sm:px-10 lg:px-16"
    >
      <Image
        src="/brand/Hero.png"
        alt={siteCopy.heroImageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_center] sm:object-[58%_center] lg:object-[54%_center]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,10,9,0.9)_0%,rgba(11,10,9,0.62)_32%,rgba(11,10,9,0.08)_70%),linear-gradient(0deg,rgba(11,10,9,0.72)_0%,rgba(11,10,9,0)_48%)]"
      />
      <div className="relative z-10 max-w-[min(54rem,90vw)]">
        <p className="mb-5 font-utility text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-copper sm:mb-7 sm:text-xs">
          {siteCopy.heroEyebrow}
        </p>
        <h1
          id="hero-heading"
          aria-label={salon.tagline}
          className="font-display text-[clamp(4rem,11vw,9rem)] font-medium leading-[0.8] tracking-[-0.055em] text-cream"
        >
          {salon.heroHeadlineLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <HeroCallButton />
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-cream/85 sm:mt-5 sm:text-sm">
          {salon.disclaimer}
        </p>
      </div>
    </Section>
  );
}
