"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { type ReactNode, useRef } from "react";

import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

gsap.registerPlugin(useGSAP, ScrollToPlugin);

const scrollDuration = 0.8;
const gestureCooldown = 150;
const touchThreshold = 40;
const panelEdgeTolerance = 2;

const nextSectionKeys = new Set([" ", "ArrowDown", "PageDown", "Spacebar"]);
const previousSectionKeys = new Set(["ArrowUp", "PageUp"]);

export function getCurrentPanelIndex(panelTops: number[], scrollY: number): number {
  if (panelTops.length === 0) return -1;

  for (let index = panelTops.length - 1; index >= 0; index -= 1) {
    if (scrollY + panelEdgeTolerance >= panelTops[index]) return index;
  }

  return 0;
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
      if (panels.length === 0) return;

      let currentPanelIndex = 0;
      let scrollTween: gsap.core.Tween | undefined;
      let unlockTimer: number | undefined;
      let isLocked = false;
      let animationFinished = false;
      let touchStartX: number | undefined;
      let touchStartY: number | undefined;
      let touchTriggered = false;

      const getPanelTops = () =>
        panels.map((panel) => panel.getBoundingClientRect().top + window.scrollY);

      const updateCurrentPanel = () => {
        currentPanelIndex = getCurrentPanelIndex(getPanelTops(), window.scrollY);
      };

      const clearUnlockTimer = () => {
        if (unlockTimer === undefined) return;
        window.clearTimeout(unlockTimer);
        unlockTimer = undefined;
      };

      const scheduleUnlock = () => {
        clearUnlockTimer();
        unlockTimer = window.setTimeout(() => {
          isLocked = false;
          animationFinished = false;
          unlockTimer = undefined;
          updateCurrentPanel();
        }, gestureCooldown);
      };

      const finishAnimation = () => {
        animationFinished = true;
        scrollTween = undefined;
        scheduleUnlock();
      };

      const scrollToTarget = (target: Element | number, panelIndex?: number) => {
        scrollTween?.kill();
        clearUnlockTimer();
        isLocked = true;
        animationFinished = false;

        if (panelIndex !== undefined) currentPanelIndex = panelIndex;

        scrollTween = gsap.to(window, {
          scrollTo: { y: target, autoKill: false },
          duration: scrollDuration,
          ease: "power2.inOut",
          overwrite: "auto",
          onComplete: finishAnimation,
        });
      };

      const lockAtBoundary = () => {
        isLocked = true;
        animationFinished = true;
        scheduleUnlock();
      };

      const panelAllowsNativeScroll = (direction: -1 | 1) => {
        updateCurrentPanel();
        const panel = panels[currentPanelIndex];
        const panelTop = panel.getBoundingClientRect().top + window.scrollY;
        const panelBottom = panelTop + panel.offsetHeight;

        if (panel.offsetHeight <= window.innerHeight + panelEdgeTolerance) return false;
        if (direction > 0) {
          return window.scrollY < panelBottom - window.innerHeight - panelEdgeTolerance;
        }

        return window.scrollY > panelTop + panelEdgeTolerance;
      };

      const moveBy = (direction: -1 | 1) => {
        updateCurrentPanel();
        const targetIndex = gsap.utils.clamp(
          0,
          panels.length - 1,
          currentPanelIndex + direction,
        );

        if (targetIndex === currentPanelIndex) {
          lockAtBoundary();
          return;
        }

        scrollToTarget(panels[targetIndex], targetIndex);
      };

      const prolongLock = () => {
        if (animationFinished) scheduleUnlock();
      };

      const handleWheel = (event: WheelEvent) => {
        if (event.deltaY === 0 || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

        if (isLocked) {
          event.preventDefault();
          prolongLock();
          return;
        }

        const direction = event.deltaY > 0 ? 1 : -1;
        if (panelAllowsNativeScroll(direction)) return;

        event.preventDefault();
        moveBy(direction);
      };

      const handleTouchStart = (event: TouchEvent) => {
        const touch = event.touches[0];
        if (!touch) return;

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchTriggered = false;
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (isLocked) {
          event.preventDefault();
          prolongLock();
          return;
        }

        const touch = event.touches[0];
        if (touchStartX === undefined || touchStartY === undefined || !touch) return;

        const deltaX = touchStartX - touch.clientX;
        const deltaY = touchStartY - touch.clientY;
        if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

        const direction = deltaY > 0 ? 1 : -1;
        if (panelAllowsNativeScroll(direction)) return;

        event.preventDefault();
        if (touchTriggered || Math.abs(deltaY) < touchThreshold) return;

        touchTriggered = true;
        moveBy(direction);
      };

      const resetTouch = () => {
        touchStartX = undefined;
        touchStartY = undefined;
        touchTriggered = false;
      };

      const shouldIgnoreKeyboardEvent = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return true;
        if (!(event.target instanceof Element)) return false;

        return Boolean(
          event.target.closest(
            "button, input, select, textarea, [contenteditable]:not([contenteditable='false'])",
          ),
        );
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        let direction: -1 | 1 | undefined;
        let targetIndex: number | undefined;

        if (nextSectionKeys.has(event.key)) direction = 1;
        else if (previousSectionKeys.has(event.key)) direction = -1;
        else if (event.key === "Home") targetIndex = 0;
        else if (event.key === "End") targetIndex = panels.length - 1;
        else return;

        if (shouldIgnoreKeyboardEvent(event)) return;

        if (isLocked) {
          event.preventDefault();
          prolongLock();
          return;
        }

        if (direction !== undefined && panelAllowsNativeScroll(direction)) return;

        event.preventDefault();
        if (targetIndex !== undefined) {
          updateCurrentPanel();
          if (targetIndex === currentPanelIndex) lockAtBoundary();
          else scrollToTarget(panels[targetIndex], targetIndex);
          return;
        }

        moveBy(direction!);
      };

      const getPanelIndexForTarget = (target: Element) =>
        panels.findIndex((panel) => panel === target || panel.contains(target));

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
        const panelIndex = getPanelIndexForTarget(target);
        scrollToTarget(panelIndex >= 0 ? panels[panelIndex] : target, panelIndex >= 0 ? panelIndex : undefined);
      };

      const landOnInitialHash = () => {
        if (!window.location.hash) return;

        let targetId: string;
        try {
          targetId = decodeURIComponent(window.location.hash.slice(1));
        } catch {
          return;
        }

        const target = document.getElementById(targetId);
        if (!target) return;

        const panelIndex = getPanelIndexForTarget(target);
        const scrollTarget = panelIndex >= 0 ? panels[panelIndex] : target;
        gsap.set(window, { scrollTo: { y: scrollTarget, autoKill: false } });
        updateCurrentPanel();
      };

      updateCurrentPanel();
      const initialHashFrame = window.requestAnimationFrame(landOnInitialHash);
      document.addEventListener("click", handleAnchorClick);
      window.addEventListener("scroll", updateCurrentPanel, { passive: true });
      window.addEventListener("resize", updateCurrentPanel, { passive: true });
      window.addEventListener("wheel", handleWheel, { passive: false });
      window.addEventListener("touchstart", handleTouchStart, { passive: true });
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", resetTouch, { passive: true });
      window.addEventListener("touchcancel", resetTouch, { passive: true });
      window.addEventListener("keydown", handleKeyDown, { capture: true });

      return () => {
        scrollTween?.kill();
        clearUnlockTimer();
        window.cancelAnimationFrame(initialHashFrame);
        document.removeEventListener("click", handleAnchorClick);
        window.removeEventListener("scroll", updateCurrentPanel);
        window.removeEventListener("resize", updateCurrentPanel);
        window.removeEventListener("wheel", handleWheel);
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", resetTouch);
        window.removeEventListener("touchcancel", resetTouch);
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
