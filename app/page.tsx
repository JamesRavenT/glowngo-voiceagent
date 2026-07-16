import { About } from "@/components/sections/about";
import { Footer } from "@/components/layout/footer";
import { SectionSnap } from "@/components/layout/section-snap";
import { Contact } from "@/components/sections/contact";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Locations } from "@/components/sections/locations";
import { Services } from "@/components/sections/services";

export default function Home() {
  return (
    <SectionSnap>
      <Hero />
      <About />
      <Services />
      <Locations />
      <Faq />
      <div data-snap-panel className="flex h-[100svh] flex-col overflow-hidden">
        <Contact />
        <Footer />
      </div>
    </SectionSnap>
  );
}
