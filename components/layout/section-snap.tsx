"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useRef } from "react";

import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

gsap.registerPlugin(useGSAP, ScrollToPlugin, ScrollTrigger);

const anchorScrollDuration = 1.1;

const keyboardScrollKeys = new Set([
  " ",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  "Spacebar",
  "Tab",
]);

export function getPanelSnapOffsets(panelOffsets: number[], scrollRange: number): number[] {
  if (scrollRange <= 0) return [0];

  return panelOffsets.map((offset) => gsap.utils.clamp(0, 1, offset / scrollRange));
}

export function SectionSnap({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const container = containerRef.current;
      const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");

      if (!container || prefersReducedMotion || reducedMotionQuery?.matches) return;

      const panels = gsap.utils.toArray<HTMLElement>("[data-snap-panel]", container);
      let anchorScrollTween: gsap.core.Tween | undefined;
      let snapOffsets: number[] = [];
      let lastKeyboardScroll = Number.NEGATIVE_INFINITY;

      const updateSnapOffsets = () => {
        const scrollRange = Math.max(0, container.scrollHeight - window.innerHeight);
        snapOffsets = getPanelSnapOffsets(
          panels.map((panel) => panel.offsetTop),
          scrollRange,
        );
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (keyboardScrollKeys.has(event.key)) lastKeyboardScroll = performance.now();
      };

      const handleAnchorClick = (event: MouseEvent) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          !(event.target instanceof Element)
        ) {
          return;
        }

        const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
        if (!anchor || anchor.download || (anchor.target && anchor.target !== "_self")) return;

        const url = new URL(anchor.href, window.location.href);
        if (
          !url.hash ||
          url.origin !== window.location.origin ||
          url.pathname !== window.location.pathname ||
          url.search !== window.location.search
        ) {
          return;
        }

        let targetId: string;
        try {
          targetId = decodeURIComponent(url.hash.slice(1));
        } catch {
          return;
        }

        const target = document.getElementById(targetId);
        if (!target) return;

        event.preventDefault();
        window.history.pushState(null, "", url.hash);
        anchorScrollTween?.kill();
        anchorScrollTween = gsap.to(window, {
          duration: anchorScrollDuration,
          ease: "power2.inOut",
          overwrite: "auto",
          scrollTo: { y: target, autoKill: true },
        });
      };

      updateSnapOffsets();
      document.addEventListener("click", handleAnchorClick);
      window.addEventListener("keydown", handleKeyDown, { capture: true });

      ScrollTrigger.create({
        id: "section-snap",
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onRefresh: updateSnapOffsets,
        snap: {
          snapTo: (progress) => {
            if (performance.now() - lastKeyboardScroll < 1000) return progress;
            return gsap.utils.snap(snapOffsets, progress);
          },
          duration: { min: 0.7, max: 1.4 },
          delay: 0.05,
          ease: "power2.inOut",
          directional: true,
        },
      });

      return () => {
        anchorScrollTween?.kill();
        document.removeEventListener("click", handleAnchorClick);
        window.removeEventListener("keydown", handleKeyDown, { capture: true });
      };
    },
    {
      scope: containerRef,
      dependencies: [prefersReducedMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <main ref={containerRef} id="main-content">
      {children}
    </main>
  );
}
