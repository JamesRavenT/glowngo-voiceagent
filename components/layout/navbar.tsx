"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { salon, siteCopy } from "@/content/salon";

const navigationLinks = siteCopy.sections.filter((section) => section.id !== "hero");
const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Navbar() {
  const [activeSection, setActiveSection] = useState("hero");
  const [heroVisible, setHeroVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sections = siteCopy.sections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
        const heroEntry = entries.find((entry) => entry.target.id === "hero");
        if (heroEntry) setHeroVisible(heroEntry.isIntersecting);
      },
      { rootMargin: "-72px 0px -55%", threshold: [0, 0.15, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const menu = menuRef.current;
    const focusable = menu?.querySelectorAll<HTMLElement>(focusableSelector);
    focusable?.[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${heroVisible ? "bg-transparent" : "border-b border-copper/30 bg-ink/95 backdrop-blur"}`}>
      <nav aria-label={siteCopy.navigationLabel} className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-6 sm:px-10 lg:px-16">
        <a href="#hero" aria-current={activeSection === "hero" ? "location" : undefined}>
          <Image src="/brand/Navbar Text.png" alt={`${salon.name} wordmark`} width={162} height={64} priority className="h-auto w-32 sm:w-36" />
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {navigationLinks.map((link) => (
            <li key={link.id}>
              <a href={`#${link.id}`} aria-current={activeSection === link.id ? "location" : undefined} className={`text-sm transition-colors hover:text-gold-hi ${activeSection === link.id ? "text-gold-hi" : "text-cream"}`}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <button ref={menuButtonRef} type="button" className="rounded-sm p-2 text-cream md:hidden" aria-label={siteCopy.openMenuLabel} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(true)}>
          <Menu aria-hidden="true" />
        </button>
      </nav>
      {menuOpen && (
        <div ref={menuRef} id="mobile-navigation" role="dialog" aria-modal="true" aria-label={siteCopy.navigationLabel} className="fixed inset-0 z-50 flex flex-col bg-ink px-6 py-5 md:hidden">
          <div className="flex h-14 items-center justify-between">
            <Image src="/brand/Navbar Text.png" alt={`${salon.name} wordmark`} width={162} height={64} className="h-auto w-32" />
            <button type="button" className="rounded-sm p-2 text-cream" aria-label={siteCopy.closeMenuLabel} onClick={() => { closeMenu(); menuButtonRef.current?.focus(); }}>
              <X aria-hidden="true" />
            </button>
          </div>
          <ul className="flex flex-1 flex-col justify-center gap-6">
            {navigationLinks.map((link) => (
              <li key={link.id}>
                <a href={`#${link.id}`} aria-current={activeSection === link.id ? "location" : undefined} onClick={closeMenu} className={`font-display text-4xl ${activeSection === link.id ? "text-gold-hi" : "text-cream"}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
