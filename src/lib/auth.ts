import { hash, compare } from "bcryptjs";
import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { nanoid } from "nanoid";

export interface SessionPayload {
  userId: string;
  email: string;
  expiresAt: number;
}

const SALT_ROUNDS = 10;
const COOKIE_NAME = "bitacora_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encodeSession(payload: SessionPayload): string {
  const secret = getSessionSecret();
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json, "utf-8").toString("base64url");
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
}

function decodeSession(token: string): SessionPayload | null {
  try {
    const secret = getSessionSecret();
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expectedSignature = sign(encoded, secret);
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

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function createSession(
  userId: string,
  email: string
): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload: SessionPayload = { userId, email, expiresAt };
  const token = encodeSession(payload);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });

  return token;
}

export function validateSession(cookie: string): SessionPayload | null {
  return decodeSession(cookie);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function getSessionFromRequest(
  request: Request
): SessionPayload | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!match) return null;

  const token = match.substring(COOKIE_NAME.length + 1);
  return decodeSession(token);
}

export async function ensureAdminExists(): Promise<void> {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required to create the initial admin user"
    );
  }

  const passwordHash = await hashPassword(password);
  const now = Date.now();

  await db.insert(users).values({
    id: nanoid(),
    email,
    name: "Admin",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });
}
