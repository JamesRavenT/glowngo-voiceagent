import { siteCopy } from "@/content/salon";

export function Footer() {
  return (
    <footer className="border-t border-copper/50 bg-ink px-6 py-4 sm:px-10 lg:px-16">
      <p className="mx-auto max-w-7xl text-sm text-cream">{siteCopy.footerCopyright}</p>
    </footer>
  );
}
