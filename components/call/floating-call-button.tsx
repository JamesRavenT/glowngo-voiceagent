"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { PhoneCall } from "lucide-react";
import { motion } from "motion/react";

import { useCall } from "@/components/call/call-provider";
import { callCopy, contactCopy } from "@/content";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function FloatingCallButton() {
  const { isMinimized, open, restore } = useCall();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isExpanded, setIsExpanded] = useState(true);
  const lastScrollY = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isMinimized) {
      buttonRef.current?.focus();
      return;
    }

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
  }, [isMinimized]);

  const accessibleName = isMinimized
    ? callCopy.minimizedCallButtonAccessibleName
    : contactCopy.floatingCallButtonAccessibleName;

  return (
    <Fragment>
    <motion.button
      ref={buttonRef}
      layout={!prefersReducedMotion}
      type="button"
      aria-label={accessibleName}
      data-expanded={isMinimized ? undefined : isExpanded}
      data-live={isMinimized}
      data-pulse={!prefersReducedMotion}
      onClick={() => isMinimized ? restore() : open("floating")}
      animate={isMinimized && !prefersReducedMotion ? {
        scale: [1, 1.06, 1],
        boxShadow: ["0 0 0 0 rgba(176,112,60,0)", "0 0 0 10px rgba(176,112,60,0.2)", "0 0 0 0 rgba(176,112,60,0)"],
      } : { scale: 1 }}
      transition={isMinimized && !prefersReducedMotion ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
      className={`floating-call-button fixed right-5 bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] z-40 flex min-h-14 min-w-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-copper font-utility text-xs font-semibold uppercase tracking-[0.1em] text-ink shadow-lg transition-colors hover:bg-gold-hi focus-visible:ring-4 focus-visible:ring-gold-hi/50 md:right-8 md:bottom-8 ${isMinimized ? "size-14 p-0" : `px-4 md:px-5 ${prefersReducedMotion ? "" : "floating-call-button--pulse"}`}`}
    >
      {isMinimized && (
        <span aria-hidden="true" className="absolute inset-1.5">
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold-hi border-r-gold-hi"
            animate={prefersReducedMotion ? undefined : { rotate: 360 }}
            transition={prefersReducedMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-transparent border-b-ink border-l-ink"
            animate={prefersReducedMotion ? undefined : { rotate: -360 }}
            transition={prefersReducedMotion ? undefined : { duration: 2.1, repeat: Infinity, ease: "linear" }}
          />
        </span>
      )}
      <PhoneCall aria-hidden="true" className="size-5 shrink-0" />
      {!isMinimized && <motion.span
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
      </motion.span>}
      {!isMinimized && <span aria-hidden="true" className="hidden whitespace-nowrap md:inline">
        {contactCopy.floatingCallButtonLabel}
      </span>}
    </motion.button>
    {isMinimized && <span role="status" aria-live="polite" className="sr-only">{callCopy.minimizedCallAnnouncement}</span>}
    </Fragment>
  );
}
