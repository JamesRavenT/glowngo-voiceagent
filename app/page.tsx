import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Locations } from "@/components/sections/locations";
import { Services } from "@/components/sections/services";

export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <About />
      <Services />
      <Locations />
      <Faq />
      <Contact />
    </main>
  );
}
