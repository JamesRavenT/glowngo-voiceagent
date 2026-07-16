"use client";

import { Mic } from "lucide-react";
import { useCall } from "@/components/call/call-provider";
import { Button } from "@/components/ui/button";
import { contactCopy, examplePhrases, siteCopy } from "@/content";
import { publicEnv } from "@/lib/env";

const featuredExamplePhrases = [examplePhrases[0], examplePhrases[4], examplePhrases[5]];

export function Contact({ bookingSheetUrl = publicEnv.bookingSheetUrl }: { bookingSheetUrl?: string }) {
  const { open } = useCall();
  const heading = siteCopy.sections.find((section) => section.id === "contact")!.heading;

  return (
    <section id="contact" aria-labelledby="contact-heading" className="nocturne-panel min-h-0 flex-1 overflow-hidden border-b border-gold-lo/30 px-5 pb-3 pt-[4.5rem] sm:px-10 sm:pb-5 sm:pt-24 lg:px-[6vw] lg:py-[7vh]">
      <div className="mx-auto grid h-full max-w-7xl content-center gap-3 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-[8vw]">
        <div className="text-center lg:text-left">
          <p className="font-utility text-[0.62rem] uppercase tracking-[0.22em] text-copper">05 / {contactCopy.eyebrow}</p>
          <h2 id="contact-heading" className="mt-1 font-display text-[3.5rem] font-normal leading-[0.82] tracking-[-0.05em] text-cream sm:text-7xl lg:text-[clamp(5rem,10vw,9rem)]">{heading}</h2>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-[1.4] text-muted sm:text-sm lg:mx-0 lg:mt-4 lg:text-base">{contactCopy.introduction}</p>
          <Button size="lg" aria-label={contactCopy.floatingCallButtonAccessibleName} onClick={() => open("contact")} className="mt-3 h-auto rounded-full px-5 py-3 font-utility text-[0.68rem] uppercase tracking-[0.12em] shadow-[0_0_2rem_rgb(176_112_60_/_0.2)] sm:px-7 sm:py-4 lg:mt-6">
          <Mic aria-hidden="true" className="size-5" />{contactCopy.callButton}
          </Button>
        </div>
        <div className="border-t border-gold-lo/50 pt-3 text-left lg:border-l lg:border-t-0 lg:pl-[4vw] lg:pt-0">
          <h3 className="font-display text-xl font-normal text-cream sm:text-2xl">{contactCopy.examplePhrasesHeading}</h3>
          <ul className="mt-1.5 space-y-1">
            {featuredExamplePhrases.map((phrase) => <li key={phrase} className="border-l border-copper/70 py-0.5 pl-3 font-mono text-[0.61rem] leading-[1.35] text-cream sm:text-xs lg:py-1">“{phrase}”</li>)}
          </ul>
          <div className="mt-3 border-t border-gold-lo/40 pt-2.5">
            <h3 className="font-display text-lg font-normal text-cream sm:text-xl">{contactCopy.bookingSheetHeading}</h3>
            {bookingSheetUrl ? (
              <><a href={bookingSheetUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[0.68rem] text-copper underline underline-offset-4 hover:text-gold-hi sm:text-xs">{contactCopy.bookingSheetLink}</a><p className="mt-1 text-[0.6rem] leading-[1.35] text-muted sm:text-[0.68rem]">{contactCopy.bookingSheetDisclaimer}</p></>
            ) : <p className="mt-1 text-[0.68rem] leading-[1.35] text-muted sm:text-xs">{contactCopy.bookingSheetUnavailable}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
