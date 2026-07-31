import { Section } from "@/components/layout/section";
import { serviceCategories, services, servicesCopy, siteCopy } from "@/content";
import type { ServiceCategory } from "@/content";
import { formatDuration, formatPrice } from "@/lib/format";

const servicesByCategory = serviceCategories.map((category) => ({
  category,
  services: services.filter((service) => service.category === category),
}));

const categoryOrbitClasses = [
  "lg:left-0 lg:top-[11%] lg:h-[78%] lg:w-[35%]",
  "lg:left-[33%] lg:top-0 lg:h-[59%] lg:w-[32%]",
  "lg:right-0 lg:top-[6%] lg:h-[88%] lg:w-[38%]",
] as const;

function ServiceCategoryCard({
  category,
  categoryIndex,
}: {
  category: ServiceCategory;
  categoryIndex: number;
}) {
  const categoryServices = servicesByCategory[categoryIndex].services;

  return (
    <article
      aria-labelledby={`services-${categoryIndex}-heading`}
      className={`flex flex-col justify-center border border-gold-lo/60 bg-ink/95 px-4 py-1.5 text-center shadow-[0_0_3rem_rgb(138_90_43/0.12)] [border-radius:45%/10%] lg:absolute lg:min-h-0 lg:px-[3vw] lg:py-[3svh] lg:[border-radius:50%] ${categoryOrbitClasses[categoryIndex]}`}
    >
      <h3
        id={`services-${categoryIndex}-heading`}
        className="font-display text-base font-medium leading-none tracking-[-0.025em] text-gold-hi sm:text-2xl lg:text-3xl lg:leading-9"
      >
        {category}
      </h3>
      <ul className="mt-0.5 divide-y divide-gold-lo/30 lg:mt-3">
        {categoryServices.map((service) => (
          <li
            key={service.id}
            data-service-id={service.id}
            className="flex items-center justify-between gap-2 py-0.5 text-left lg:gap-3 lg:py-2.5"
          >
            <div className="min-w-0">
              <span className="block text-[0.78rem] font-medium leading-tight text-cream sm:text-sm lg:text-base">
                {service.name}
              </span>
              {"requiresConsultation" in service && service.requiresConsultation && (
                <span className="inline-block border border-copper/70 px-1 py-px font-utility text-[0.45rem] uppercase leading-none tracking-[0.06em] text-gold-hi lg:mt-0.5 lg:px-1.5 lg:py-0.5 lg:tracking-[0.08em] lg:text-[0.5rem]">
                  {servicesCopy.consultationRequired}
                </span>
              )}
            </div>
            <span className="shrink-0 whitespace-nowrap font-mono text-[0.6rem] text-muted sm:text-xs lg:text-[0.68rem]">
              {formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function Services() {
  const heading = siteCopy.sections.find((section) => section.id === "services")!.heading;

  return (
    <Section
      id="services"
      aria-labelledby="services-heading"
      className="relative flex min-h-[100svh] flex-col overflow-hidden border-b border-gold-lo/30 bg-[radial-gradient(ellipse_at_78%_50%,rgb(138_90_43/0.17)_0_1%,transparent_38%)] bg-ink px-5 pb-4 pt-20 sm:px-10 sm:pb-6 sm:pt-24 lg:px-16 lg:pt-[10svh] lg:pb-[4svh]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[50vw] top-[14svh] h-[72svh] w-[90vw] rounded-[50%] border border-copper/30 shadow-[0_0_4.5rem_rgb(138_90_43/0.13)] lg:-right-[10vw] lg:w-[42vw]"
      />

      <header className="relative z-10 mx-auto w-full max-w-7xl shrink-0 lg:text-center">
        <p className="font-utility text-[0.65rem] uppercase tracking-[0.2em] text-copper">
          {servicesCopy.eyebrow}
        </p>
        <h2
          id="services-heading"
          className="mt-1 font-display text-4xl font-normal tracking-[-0.045em] text-cream sm:text-5xl lg:text-[clamp(3.5rem,7vw,6.25rem)] lg:leading-none"
        >
          {heading}
        </h2>
      </header>

      <div
        className="relative z-10 mx-auto mt-2 flex w-full max-w-7xl flex-1 flex-col lg:mt-[2svh] lg:block lg:h-[64svh] lg:max-h-[36rem] lg:min-h-0 lg:flex-none"
      >
        <div
          aria-label="Service categories"
          className="grid flex-1 content-start gap-1 lg:relative lg:ml-0 lg:block lg:h-full lg:min-h-0"
        >
          {servicesByCategory.map(({ category }, categoryIndex) => (
            <ServiceCategoryCard key={category} category={category} categoryIndex={categoryIndex} />
          ))}
        </div>
      </div>
    </Section>
  );
}
