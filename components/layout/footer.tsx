import { siteCopy } from "@/content/salon";

export function Footer() {
  return (
    <footer className="border-t border-copper/50 bg-ink py-4 pl-6 pr-40 sm:pl-10 md:px-10 lg:px-16">
      <p className="mx-auto max-w-7xl text-sm text-cream">{siteCopy.footerCopyright}</p>
    </footer>
  );
}
