"use client";

import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Bitácora
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Sign in to your knowledge harbor
            </p>
          </div>

          <AuthForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/"
            className="font-medium text-slate-700 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-slate-100"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
