import Image from "next/image";

import { Section } from "@/components/layout/section";
import { branches, locationsCopy, siteCopy } from "@/content";
import type { DayOfWeek, OpeningHours, WeeklyHours } from "@/content";

const businessWeek = [
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "monday",
] as const satisfies readonly DayOfWeek[];

function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const displayHour = hour % 12 || 12;

  return minute === 0
    ? displayHour.toString()
    : `${displayHour}:${minute.toString().padStart(2, "0")}`;
}

function hoursKey(hours: OpeningHours): string {
  return "closed" in hours ? "closed" : `${hours.open}-${hours.close}`;
}

function formatDayRange(start: DayOfWeek, end: DayOfWeek): string {
  const startLabel = locationsCopy.dayLabels[start].slice(0, 3);
  const endLabel = locationsCopy.dayLabels[end].slice(0, 3);

  return start === end ? startLabel : `${startLabel}–${endLabel}`;
}

function formatGroupedHours(hours: WeeklyHours): string {
  const groups: Array<{ start: DayOfWeek; end: DayOfWeek; hours: OpeningHours }> = [];

  businessWeek.forEach((day) => {
    const currentHours = hours[day];
    const previousGroup = groups.at(-1);

    if (previousGroup && hoursKey(previousGroup.hours) === hoursKey(currentHours)) {
      previousGroup.end = day;
      return;
    }

    groups.push({ start: day, end: day, hours: currentHours });
  });

  return groups
    .map(({ start, end, hours: groupedHours }) => {
      const range = formatDayRange(start, end);
      return "closed" in groupedHours
        ? `${range} ${locationsCopy.closedLabel.toLowerCase()}`
        : `${range} ${formatTime(groupedHours.open)}–${formatTime(groupedHours.close)}`;
    })
    .join(" · ");
}

export function Locations() {
  const heading = siteCopy.sections.find((section) => section.id === "locations")!.heading;

  return (
    <Section
      id="locations"
      data-snap-panel
      aria-labelledby="locations-heading"
      className="relative flex flex-col overflow-hidden border-b border-gold-lo/30 bg-ink px-4 pb-2 pt-20 sm:px-8 sm:pb-4 lg:block lg:px-0 lg:py-0"
    >
      <Image
        src="/brand/storefront.png"
        alt={locationsCopy.imageAlt}
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center sepia-[0.28] contrast-110"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(11_10_9/0.88),rgb(11_10_9/0.55)_35%,rgb(11_10_9/0.9)),radial-gradient(ellipse_at_78%_50%,rgb(176_112_60/0.2),transparent_48%)] lg:bg-[linear-gradient(90deg,rgb(11_10_9/0.96),rgb(11_10_9/0.44)_48%,rgb(11_10_9/0.86))]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[48vw] top-[14svh] -z-10 h-[72svh] w-[92vw] rounded-[50%] border border-copper/25 shadow-[0_0_4.5rem_rgb(138_90_43/0.18)] lg:-right-[7vw] lg:w-[48vw]"
      />

      <header className="relative z-10 shrink-0 lg:absolute lg:left-[6vw] lg:top-[20svh] lg:w-[41vw]">
        <p className="font-utility text-[0.58rem] uppercase tracking-[0.2em] text-gold-hi sm:text-[0.65rem]">
          {heading}
        </p>
        <h2
          id="locations-heading"
          aria-label={heading}
          className="mt-0.5 font-display text-[2.15rem] font-normal leading-none tracking-[-0.045em] text-cream sm:text-5xl lg:mt-2 lg:text-[clamp(2.75rem,4.6vw,5rem)] lg:leading-[0.82]"
        >
          Find your light.
        </h2>
      </header>

      <div className="relative z-10 mt-1 grid min-h-0 flex-1 grid-rows-4 lg:absolute lg:bottom-[8svh] lg:right-[5vw] lg:top-[14svh] lg:mt-0 lg:w-[52vw] lg:grid-cols-2 lg:grid-rows-2 lg:gap-3">
        {branches.map((branch) => (
          <article
            key={branch.id}
            data-branch-id={branch.id}
            className="grid min-h-0 grid-cols-[1.08fr_0.92fr] grid-rows-[auto_auto] content-center gap-x-3 border-t border-gold-lo/70 bg-ink/75 px-3 py-1.5 text-left first:border-t-0 lg:flex lg:flex-col lg:items-center lg:justify-center lg:border lg:border-gold-lo/60 lg:bg-ink/80 lg:px-8 lg:py-5 lg:text-center lg:shadow-[0_0_3rem_rgb(138_90_43/0.14)] lg:[border-radius:50%/18%] lg:first:border-t"
          >
            <h3 className="self-end font-display text-[1.15rem] font-medium leading-none tracking-[-0.03em] text-cream sm:text-2xl lg:self-auto lg:text-[clamp(1.6rem,2.2vw,2.25rem)]">
              {branch.name}
            </h3>
            <a
              className="self-end justify-self-start whitespace-nowrap font-mono text-[0.57rem] leading-tight text-gold-hi underline decoration-gold-lo underline-offset-2 transition-colors hover:text-cream sm:text-xs lg:mt-3 lg:self-auto lg:justify-self-auto lg:text-sm"
              href={`tel:${branch.phone.replace(/\D/g, "")}`}
            >
              {branch.phone}
            </a>
            <address className="mt-1 max-w-[22ch] self-start not-italic text-[0.59rem] leading-[1.25] text-muted sm:text-xs lg:mt-2 lg:self-auto lg:text-sm lg:leading-relaxed">
              {branch.address}
            </address>
            <p className="mt-1 self-start font-mono text-[0.5rem] leading-[1.25] text-cream sm:text-[0.65rem] lg:mt-4 lg:self-auto lg:text-xs">
              <span className="sr-only">{locationsCopy.hoursLabel}: </span>
              {formatGroupedHours(branch.hours)}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
