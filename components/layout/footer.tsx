import Image from "next/image";

import { salon, siteCopy } from "@/content/salon";

const footerLinks = siteCopy.sections.slice(1);

export function Footer() {
  return (
    <footer className="border-t border-copper/50 bg-ink px-6 pb-28 pt-12 sm:px-10 sm:pb-32 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <a href="#hero" className="w-fit">
            <Image
              src="/brand/Navbar Text.png"
              alt={`${salon.name} wordmark`}
              width={162}
              height={64}
              className="h-auto w-36"
            />
          </a>
          <nav aria-label={siteCopy.footerNavigationLabel}>
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.id}>
                  <a className="text-sm text-cream transition-colors hover:text-gold-hi" href={`#${link.id}`}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="max-w-3xl border-l-2 border-copper pl-5 text-base leading-relaxed text-cream sm:text-lg">
          {salon.disclaimer}
        </p>
      </div>
    </footer>
  );
}
