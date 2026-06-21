import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import LogoutButton from "./LogoutButton";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bitacora_session");

  if (!sessionCookie) {
    redirect("/");
  }

  const session = validateSession(sessionCookie.value);

  if (!session) {
    redirect("/");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    redirect("/");
  }

  const createdAt = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
        Settings
      </h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
          Account
        </h2>

        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-slate-500">Email</dt>
            <dd className="mt-1 text-sm text-slate-900">{user.email}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">Name</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {user.name || "—"}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">
              Member since
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{createdAt}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
          Session
        </h2>
        <LogoutButton />
      </div>
    </div>
  );
}
