type SectionProps = {
  id: string;
  heading: string;
  headingLevel?: 1 | 2;
};

export function Section({ id, heading, headingLevel = 2 }: SectionProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="flex min-h-[70svh] items-center border-b border-gold-lo/30 px-6 py-24 sm:px-10 lg:px-16"
    >
      <Heading
        id={`${id}-heading`}
        className="font-display text-5xl font-medium tracking-[-0.055em] text-cream sm:text-7xl"
      >
        {heading}
      </Heading>
    </section>
  );
}
