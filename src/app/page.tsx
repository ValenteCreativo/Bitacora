import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-16 font-sans dark:bg-slate-950">
      <main className="flex w-full max-w-2xl flex-col items-center text-center">
        {/* Hero */}
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-6xl">
          Bitácora
        </h1>
        <p className="mt-4 text-lg font-medium text-slate-500 dark:text-slate-400">
          Save first. Understand later.
        </p>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          An open-source, self-hostable knowledge harbor that automatically maps
          relationships between your ideas, links, notes and discoveries.
        </p>

        {/* Features */}
        <ul className="mt-12 grid gap-3 text-left text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400 dark:text-slate-500">•</span>
            Save links and notes instantly
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400 dark:text-slate-500">•</span>
            Automatic metadata extraction
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400 dark:text-slate-500">•</span>
            Knowledge graph emerges from your content
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400 dark:text-slate-500">•</span>
            Collections, channels, and tags
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400 dark:text-slate-500">•</span>
            Mobile-first capture flow
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400 dark:text-slate-500">•</span>
            Self-hostable, private by default
          </li>
        </ul>

        {/* CTA */}
        <div className="mt-12">
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-md bg-slate-900 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Get Started
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 flex flex-col items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <p>Open Source · MIT License</p>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}
