"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneCall } from "lucide-react";
import { motion } from "motion/react";

import { useCall } from "@/components/call/call-provider";
import { contactCopy } from "@/content";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function FloatingCallButton() {
  const { open } = useCall();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isExpanded, setIsExpanded] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    let frameId: number | null = null;

    const updateFromScroll = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - lastScrollY.current;

      if (Math.abs(delta) >= 8) {
        setIsExpanded(delta < 0 || nextScrollY <= 16);
        lastScrollY.current = nextScrollY;
      }

      frameId = null;
    };

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateFromScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label={contactCopy.floatingCallButtonAccessibleName}
      data-expanded={isExpanded}
      data-pulse={!prefersReducedMotion}
      onClick={() => open("floating")}
      className={`floating-call-button fixed right-5 bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] z-40 flex min-h-14 min-w-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-copper px-4 font-utility text-xs font-semibold uppercase tracking-[0.1em] text-ink shadow-lg transition-colors hover:bg-gold-hi focus-visible:ring-4 focus-visible:ring-gold-hi/50 md:right-8 md:bottom-8 md:px-5 ${prefersReducedMotion ? "" : "floating-call-button--pulse"}`}
    >
      <PhoneCall aria-hidden="true" className="size-5 shrink-0" />
      <motion.span
        aria-hidden="true"
        data-visible={isExpanded}
        initial={false}
        animate={{
          width: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
        className="overflow-hidden whitespace-nowrap md:hidden"
      >
        {contactCopy.floatingCallButtonLabel}
      </motion.span>
      <span aria-hidden="true" className="hidden whitespace-nowrap md:inline">
        {contactCopy.floatingCallButtonLabel}
      </span>
    </button>
  );
}
