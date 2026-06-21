import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac } from "crypto";

interface SessionPayload {
  userId: string;
  email: string;
  expiresAt: number;
}

const COOKIE_NAME = "bitacora_session";

function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return secret;
}

function validateSessionToken(token: string): SessionPayload | null {
  try {
    const secret = getSessionSecret();
    if (!secret) return null;

    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expectedSignature = createHmac("sha256", secret)
      .update(encoded)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;

    if (!payload.userId || !payload.email || !payload.expiresAt) return null;
    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}

function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return validateSessionToken(cookie.value);
}

export function proxy(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const pathname = request.nextUrl.pathname;

  if (!session) {
    // API routes: return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Page routes: redirect to /login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/settings/:path*", "/api/((?!auth).*)"],
};
