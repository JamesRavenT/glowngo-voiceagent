"use client";

import { Mic } from "lucide-react";
import { useCall } from "@/components/call/call-provider";
import { Button } from "@/components/ui/button";
import { contactCopy, examplePhrases, services, siteCopy } from "@/content";
import { formatDuration, formatPrice } from "@/lib/format";
import { publicEnv } from "@/lib/env";

export function Contact({ bookingSheetUrl = publicEnv.bookingSheetUrl }: { bookingSheetUrl?: string }) {
  const { open } = useCall();
  const heading = siteCopy.sections.find((section) => section.id === "contact")!.heading;

  return (
    <section id="contact" aria-labelledby="contact-heading" className="border-b border-gold-lo/30 bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <p className="font-utility text-xs uppercase tracking-[0.22em] text-copper">{contactCopy.eyebrow}</p>
        <h2 id="contact-heading" className="mt-5 max-w-4xl font-display text-5xl tracking-[-0.05em] text-cream sm:text-7xl">{heading}</h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{contactCopy.introduction}</p>
        <Button size="lg" onClick={() => open("contact")} className="mt-9 h-auto rounded-none px-7 py-5 font-utility text-sm uppercase tracking-[0.12em]">
          <Mic aria-hidden="true" className="size-5" />{contactCopy.callButton}
        </Button>

        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="font-display text-3xl text-cream">{contactCopy.examplePhrasesHeading}</h3>
            <ul className="mt-6 space-y-3">
              {examplePhrases.map((phrase) => <li key={phrase} className="border-l border-copper/70 py-2 pl-4 font-mono text-sm leading-relaxed text-cream">“{phrase}”</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-3xl text-cream">{contactCopy.quickReferenceHeading}</h3>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <caption className="sr-only">{contactCopy.quickReferenceCaption}</caption>
                <thead className="border-b border-gold-lo/50 font-utility text-[0.65rem] uppercase tracking-[0.15em] text-muted"><tr><th className="pb-3 font-medium">{contactCopy.serviceColumn}</th><th className="pb-3 text-right font-medium">{contactCopy.durationColumn}</th><th className="pb-3 text-right font-medium">{contactCopy.priceColumn}</th></tr></thead>
                <tbody>{services.map((service) => <tr key={service.id} data-quick-service-id={service.id} className="border-b border-gold-lo/30"><th scope="row" className="py-3 pr-4 font-normal text-cream">{service.name}</th><td className="whitespace-nowrap py-3 text-right font-mono text-muted">{formatDuration(service.durationMinutes)}</td><td className="whitespace-nowrap py-3 text-right font-mono text-muted">{formatPrice(service.priceCents)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gold-lo/40 pt-8">
          <h3 className="font-display text-2xl text-cream">{contactCopy.bookingSheetHeading}</h3>
          {bookingSheetUrl ? (
            <><a href={bookingSheetUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-copper underline underline-offset-4 hover:text-gold-hi">{contactCopy.bookingSheetLink}</a><p className="mt-2 text-sm text-muted">{contactCopy.bookingSheetDisclaimer}</p></>
          ) : <p className="mt-3 text-muted">{contactCopy.bookingSheetUnavailable}</p>}
        </div>
      </div>
    </section>
  );
}
