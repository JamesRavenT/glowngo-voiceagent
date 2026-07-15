import { services, servicesCopy, siteCopy } from "@/content";
import { formatDuration, formatPrice } from "@/lib/format";

export function Services() {
  const heading = siteCopy.sections.find((section) => section.id === "services")!.heading;

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="border-b border-gold-lo/30 bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16 lg:py-40"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(0,2fr)] lg:gap-20">
        <h2 id="services-heading" className="font-utility text-xs font-medium uppercase tracking-[0.22em] text-copper">
          {heading}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-left">
            <caption className="sr-only">{servicesCopy.tableCaption}</caption>
            <thead className="border-b border-gold-lo/50 font-utility text-[0.65rem] uppercase tracking-[0.18em] text-muted">
              <tr>
                <th scope="col" className="pb-5 font-medium">{servicesCopy.serviceColumn}</th>
                <th scope="col" className="pb-5 pr-6 text-right font-medium">{servicesCopy.durationColumn}</th>
                <th scope="col" className="pb-5 text-right font-medium">{servicesCopy.priceColumn}</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} data-service-id={service.id} className="border-b border-gold-lo/30 align-top last:border-b-0">
                  <th scope="row" className="py-7 pr-8 font-normal">
                    <span className="font-display text-2xl font-medium tracking-[-0.025em] text-cream sm:text-3xl">{service.name}</span>
                    {"requiresConsultation" in service && service.requiresConsultation && (
                      <span className="ml-3 inline-block border border-copper/70 px-2 py-1 align-middle font-utility text-[0.6rem] uppercase tracking-[0.12em] text-gold-hi">
                        {servicesCopy.consultationRequired}
                      </span>
                    )}
                    <span className="mt-2 block max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{service.description}</span>
                  </th>
                  <td className="whitespace-nowrap py-8 pr-6 text-right font-mono text-sm text-cream">{formatDuration(service.durationMinutes)}</td>
                  <td className="whitespace-nowrap py-8 text-right font-mono text-sm text-cream">{formatPrice(service.priceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
