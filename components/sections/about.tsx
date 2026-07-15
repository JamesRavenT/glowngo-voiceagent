import { about } from "@/content";

export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="border-b border-gold-lo/30 bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16 lg:py-40"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(0,2fr)] lg:gap-20">
        <h2
          id="about-heading"
          className="font-utility text-xs font-medium uppercase tracking-[0.22em] text-copper"
        >
          {about.heading}
        </h2>
        <div className="max-w-4xl">
          <p className="max-w-[19ch] font-display text-4xl font-medium leading-[0.98] tracking-[-0.045em] text-cream sm:text-6xl lg:text-7xl">
            {about.lead}
          </p>
          <div className="mt-14 grid gap-8 text-lg leading-relaxed text-muted sm:mt-20 sm:grid-cols-2 lg:gap-x-12 lg:text-xl">
            {about.paragraphs.map((paragraph, index) => (
              <p key={paragraph} className={index === 2 ? "sm:col-start-2" : undefined}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
