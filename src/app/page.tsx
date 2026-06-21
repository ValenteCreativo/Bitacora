import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f5f0e8]">
      {/* Nautical grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 119, 91, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 119, 91, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Compass rose decoration — top right */}
      <svg
        className="pointer-events-none absolute top-8 right-8 w-32 h-32 opacity-[0.07] sm:w-48 sm:h-48"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="90" stroke="#5c4a32" strokeWidth="1" />
        <circle cx="100" cy="100" r="70" stroke="#5c4a32" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="4" fill="#5c4a32" />
        {/* Cardinal points */}
        <path d="M100 10 L104 100 L96 100 Z" fill="#5c4a32" />
        <path d="M100 190 L104 100 L96 100 Z" fill="#5c4a32" opacity="0.4" />
        <path d="M10 100 L100 96 L100 104 Z" fill="#5c4a32" opacity="0.4" />
        <path d="M190 100 L100 96 L100 104 Z" fill="#5c4a32" />
        {/* Intercardinal points */}
        <path d="M36 36 L97 97 L100 94 Z" fill="#5c4a32" opacity="0.3" />
        <path d="M164 36 L103 97 L100 94 Z" fill="#5c4a32" opacity="0.3" />
        <path d="M36 164 L97 103 L100 106 Z" fill="#5c4a32" opacity="0.3" />
        <path d="M164 164 L103 103 L100 106 Z" fill="#5c4a32" opacity="0.3" />
        {/* Degree markers */}
        <text x="100" y="22" textAnchor="middle" fontSize="8" fill="#5c4a32" fontFamily="serif">N</text>
        <text x="100" y="195" textAnchor="middle" fontSize="8" fill="#5c4a32" fontFamily="serif">S</text>
        <text x="17" y="103" textAnchor="middle" fontSize="8" fill="#5c4a32" fontFamily="serif">W</text>
        <text x="183" y="103" textAnchor="middle" fontSize="8" fill="#5c4a32" fontFamily="serif">E</text>
      </svg>

      {/* Decorative coordinate lines — bottom left */}
      <svg
        className="pointer-events-none absolute bottom-12 left-8 w-40 h-40 opacity-[0.06] sm:w-56 sm:h-56"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        {/* Latitude/longitude curves */}
        <path d="M20 40 Q 100 50, 180 40" stroke="#5c4a32" strokeWidth="0.7" fill="none" />
        <path d="M20 80 Q 100 90, 180 80" stroke="#5c4a32" strokeWidth="0.7" fill="none" />
        <path d="M20 120 Q 100 130, 180 120" stroke="#5c4a32" strokeWidth="0.7" fill="none" />
        <path d="M20 160 Q 100 170, 180 160" stroke="#5c4a32" strokeWidth="0.7" fill="none" />
        <path d="M40 20 Q 50 100, 40 180" stroke="#5c4a32" strokeWidth="0.7" fill="none" />
        <path d="M80 20 Q 90 100, 80 180" stroke="#5c4a32" strokeWidth="0.7" fill="none" />
        <path d="M120 20 Q 130 100, 120 180" stroke="#5c4a32" strokeWidth="0.7" fill="none" />
        <path d="M160 20 Q 170 100, 160 180" stroke="#5c4a32" strokeWidth="0.7" fill="none" />
      </svg>

      {/* Main content */}
      <main className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6 py-16 text-center">
        {/* Small decorative line */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px w-12 bg-[#8b775b]/30" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8b775b]/60 font-medium">
            Knowledge Harbor
          </span>
          <div className="h-px w-12 bg-[#8b775b]/30" />
        </div>

        {/* Title — serif, like old navigation charts */}
        <h1 className="font-serif text-5xl font-bold tracking-tight text-[#2c2416] sm:text-6xl lg:text-7xl">
          Bitácora
        </h1>

        {/* Tagline */}
        <p className="mt-5 font-serif text-xl italic text-[#6b5a43] sm:text-2xl">
          Save first. Understand later.
        </p>

        {/* Description */}
        <p className="mt-8 max-w-lg text-base leading-relaxed text-[#5c4a32]/80">
          An open-source, self-hostable knowledge harbor that automatically maps
          relationships between your ideas, links, notes and discoveries.
        </p>

        {/* Decorative divider */}
        <div className="my-12 flex items-center gap-4">
          <div className="h-px w-16 bg-[#8b775b]/20" />
          <svg className="w-4 h-4 text-[#8b775b]/40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2L13.5 8.5L20 7L14.5 11L18 17L12 13.5L6 17L9.5 11L4 7L10.5 8.5L12 2Z" />
          </svg>
          <div className="h-px w-16 bg-[#8b775b]/20" />
        </div>

        {/* Features — styled like chart annotations */}
        <div className="grid gap-4 text-left text-sm sm:grid-cols-2 sm:gap-x-12 sm:gap-y-4">
          <Feature icon="⚓" text="Save links and notes instantly" />
          <Feature icon="🧭" text="Automatic metadata extraction" />
          <Feature icon="🗺️" text="Knowledge graph emerges naturally" />
          <Feature icon="📐" text="Collections, channels, and tags" />
          <Feature icon="⛵" text="Mobile-first capture flow" />
          <Feature icon="🏴" text="Self-hostable, private by default" />
        </div>

        {/* CTA */}
        <div className="mt-14">
          <Link
            href="/login"
            className="inline-flex h-12 items-center gap-2 rounded-sm border border-[#2c2416] bg-[#2c2416] px-8 font-serif text-sm font-medium tracking-wide text-[#f5f0e8] transition-all hover:bg-[#3d3424] hover:shadow-lg"
          >
            Set Sail
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Coordinates decoration */}
        <p className="mt-10 font-mono text-[10px] tracking-widest text-[#8b775b]/40">
          LAT 0°00&apos;N &middot; LON 0°00&apos;W
        </p>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-8 flex flex-col items-center gap-3 pb-8">
        <div className="flex items-center gap-4 text-xs text-[#8b775b]/60">
          <span>Open Source</span>
          <span className="text-[#8b775b]/30">·</span>
          <span>MIT License</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#8b775b]/50 transition-colors hover:text-[#5c4a32]"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-base" aria-hidden="true">{icon}</span>
      <span className="text-[#5c4a32]/80">{text}</span>
    </div>
  );
}
