import Image from "next/image";

import { branches, locationsCopy, siteCopy, stylists } from "@/content";
import type { DayOfWeek, OpeningHours } from "@/content";

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const satisfies readonly DayOfWeek[];

function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return minute === 0 ? `${displayHour} ${period}` : `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatHours(hours: OpeningHours): string {
  return "closed" in hours
    ? locationsCopy.closedLabel
    : `${formatTime(hours.open)}–${formatTime(hours.close)}`;
}

export function Locations() {
  const heading = siteCopy.sections.find((section) => section.id === "locations")!.heading;

  return (
    <section id="locations" aria-labelledby="locations-heading" className="border-b border-gold-lo/30 bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16 lg:py-40">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(0,2fr)] lg:gap-20">
        <h2 id="locations-heading" className="font-utility text-xs font-medium uppercase tracking-[0.22em] text-copper">{heading}</h2>
        <div className="grid gap-14 xl:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)] xl:gap-12">
          <figure>
            <Image src="/brand/storefront.png" alt={locationsCopy.imageAlt} width={1000} height={760} sizes="(min-width: 1280px) 30vw, (min-width: 1024px) 65vw, 100vw" className="aspect-[25/19] w-full object-cover" />
            <figcaption className="mt-4 max-w-sm font-display text-xl leading-snug text-gold-hi">{locationsCopy.imageCaption}</figcaption>
          </figure>
          <div className="divide-y divide-gold-lo/30 border-y border-gold-lo/30">
            {branches.map((branch) => {
              const branchStylists = stylists.filter((stylist) => stylist.branchId === branch.id);
              return (
                <article key={branch.id} data-branch-id={branch.id} className="py-10 first:pt-0 xl:first:pt-10">
                  <h3 className="font-display text-3xl font-medium tracking-[-0.035em] text-cream sm:text-4xl">{branch.name}</h3>
                  <address className="mt-3 not-italic leading-relaxed text-muted">
                    <span className="block">{branch.address}</span>
                    <a className="text-gold-hi underline decoration-gold-lo underline-offset-4 hover:text-cream" href={`tel:${branch.phone.replace(/\D/g, "")}`}>{branch.phone}</a>
                  </address>
                  <div className="mt-7 grid gap-8 sm:grid-cols-2">
                    <div>
                      <h4 className="font-utility text-[0.65rem] uppercase tracking-[0.18em] text-copper">{locationsCopy.hoursLabel}</h4>
                      <dl className="mt-3 space-y-1 text-sm">
                        {days.map((day) => (
                          <div key={day} className="grid grid-cols-[1fr_auto] gap-4">
                            <dt className="text-muted">{locationsCopy.dayLabels[day]}</dt>
                            <dd className="font-mono text-cream">{formatHours(branch.hours[day])}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-utility text-[0.65rem] uppercase tracking-[0.18em] text-copper">{locationsCopy.stylistsLabel}</h4>
                      <ul className="mt-3 space-y-4">
                        {branchStylists.map((stylist) => (
                          <li key={stylist.id} data-stylist-id={stylist.id}>
                            <span className="block font-display text-xl font-semibold text-cream">{stylist.name}</span>
                            <span className="text-sm text-muted">{stylist.specialties.join(" · ")}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
