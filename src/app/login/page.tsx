"use client";

import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f0e8] px-4">
      {/* Nautical grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 119, 91, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 119, 91, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Compass decoration */}
      <svg
        className="pointer-events-none absolute bottom-12 left-12 w-36 h-36 opacity-[0.05]"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="90" stroke="#5c4a32" strokeWidth="1" />
        <circle cx="100" cy="100" r="70" stroke="#5c4a32" strokeWidth="0.5" />
        <path d="M100 10 L104 100 L96 100 Z" fill="#5c4a32" />
        <path d="M100 190 L104 100 L96 100 Z" fill="#5c4a32" opacity="0.4" />
        <path d="M10 100 L100 96 L100 104 Z" fill="#5c4a32" opacity="0.4" />
        <path d="M190 100 L100 96 L100 104 Z" fill="#5c4a32" />
      </svg>

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="rounded-lg border border-[#d4c9b8] bg-[#faf7f2] p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#2c2416]">
              Bitácora
            </h1>
            <p className="mt-2 text-sm text-[#8b775b]">
              Sign in to your knowledge harbor
            </p>
          </div>

          <AuthForm />
        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-sm text-[#8b775b]/70">
          <Link
            href="/"
            className="font-medium text-[#5c4a32] hover:text-[#2c2416] transition-colors"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
