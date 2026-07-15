"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faq, siteCopy } from "@/content";

export function Faq() {
  const heading = siteCopy.sections.find((section) => section.id === "faq")!.heading;
  const [openItems, setOpenItems] = useState<Set<string>>(
    () => new Set(faq.filter((item) => "defaultOpen" in item && item.defaultOpen).map((item) => item.id)),
  );

  const toggle = (id: string) => {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section id="faq" aria-labelledby="faq-heading" className="border-b border-gold-lo/30 bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16 lg:py-40">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(0,2fr)] lg:gap-20">
        <h2 id="faq-heading" className="font-utility text-xs font-medium uppercase tracking-[0.22em] text-copper">{heading}</h2>
        <div className="border-t border-gold-lo/40">
          {faq.map((item) => {
            const isOpen = openItems.has(item.id);
            const panelId = `faq-${item.id}-panel`;
            const buttonId = `faq-${item.id}-button`;
            return (
              <div key={item.id} data-faq-id={item.id} className="border-b border-gold-lo/40">
                <button id={buttonId} type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(item.id)} className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-xl text-cream sm:text-2xl">
                  {item.question}
                  <ChevronDown aria-hidden="true" className={`size-5 shrink-0 text-copper transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="pb-7 pr-10 text-base leading-relaxed text-muted sm:text-lg">
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
