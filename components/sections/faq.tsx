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
    <section id="faq" data-snap-panel aria-labelledby="faq-heading" className="nocturne-panel border-b border-gold-lo/30 px-5 pb-5 pt-20 sm:px-10 sm:pb-8 sm:pt-24 lg:px-[5vw] lg:py-[9vh]">
      <div className="mx-auto flex h-full max-w-[90rem] flex-col gap-3 lg:grid lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-[5vw]">
        <div className="faq-orbit flex shrink-0 flex-col justify-center lg:h-[68vh] lg:text-center">
          <p className="font-utility text-[0.62rem] uppercase tracking-[0.22em] text-copper">04 / FAQ</p>
          <h2 id="faq-heading" className="mt-1 font-display text-[2.65rem] font-normal leading-[0.9] tracking-[-0.045em] text-cream sm:text-6xl lg:text-[clamp(3.7rem,7vw,6.5rem)]">{heading}</h2>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 content-center lg:grid-cols-2 lg:gap-x-[3vw]">
          {faq.map((item) => {
            const isOpen = openItems.has(item.id);
            const panelId = `faq-${item.id}-panel`;
            const buttonId = `faq-${item.id}-button`;
            return (
              <div key={item.id} data-faq-id={item.id} className="border-t border-gold-lo/50 lg:even:translate-x-[2vw]">
                <button id={buttonId} type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(item.id)} className="flex w-full items-center justify-between gap-3 py-[0.38rem] text-left font-body text-[0.72rem] leading-[1.15] text-cream sm:py-2 sm:text-sm lg:py-3 lg:text-[0.82rem]">
                  {item.question}
                  <ChevronDown aria-hidden="true" className={`size-3.5 shrink-0 text-copper transition-transform duration-300 motion-reduce:transition-none lg:size-4 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="pb-2 pr-7 text-[0.62rem] leading-[1.35] text-muted sm:text-xs lg:pb-3 lg:text-[0.7rem] lg:leading-relaxed">
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
