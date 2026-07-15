import Link from "next/link";

const directions = [
  { href: "/mockups/a", name: "A — Chair Side", thesis: "You are already in the chair." },
];

export default function MockupsPage() {
  return (
    <main className="min-h-screen bg-[#0B0A09] px-6 py-16 text-[#F3EADF] sm:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="mb-5 text-xs uppercase tracking-[0.28em] text-[#B0703C]">Glow &amp; Go / Visual studies</p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">Choose the voice of the room.</h1>
        <div className="mt-16 grid gap-px bg-[#8A5A2B]">
          {directions.map((direction) => (
            <Link
              key={direction.href}
              href={direction.href}
              className="group min-h-64 bg-[#0B0A09] p-7 outline-none transition-colors hover:bg-[#8A5A2B] focus-visible:bg-[#8A5A2B]"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-[#A79383] group-hover:text-[#F3EADF]">View direction</span>
              <h2 className="mt-20 text-2xl font-semibold tracking-[-0.04em]">{direction.name}</h2>
              <p className="mt-3 text-sm text-[#A79383] group-hover:text-[#F3EADF]">{direction.thesis}</p>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-xs text-[#A79383]">Static portfolio design mockups by James Raven Tabag. No live AI or booking service.</p>
      </div>
    </main>
  );
}
