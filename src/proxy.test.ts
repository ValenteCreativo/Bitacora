import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";
import { NextRequest } from "next/server";

// Mock env variable
const TEST_SECRET = "test-session-secret-key";

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", TEST_SECRET);
});

function createSessionToken(payload: {
  userId: string;
  email: string;
  expiresAt: number;
}): string {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json, "utf-8").toString("base64url");
  const signature = createHmac("sha256", TEST_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function createRequest(url: string, cookie?: string): NextRequest {
  const req = new NextRequest(new URL(url, "http://localhost:3000"));
  if (cookie) {
    req.cookies.set("bitacora_session", cookie);
  }
  return req;
}

describe("proxy - route protection", () => {
  it("redirects unauthenticated page requests to /login", async () => {
    const { proxy } = await import("./proxy");
    const request = createRequest("/app/dashboard");
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("redirects unauthenticated /settings requests to /login", async () => {
    const { proxy } = await import("./proxy");
    const request = createRequest("/settings");
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("returns 401 JSON for unauthenticated API requests", async () => {
    const { proxy } = await import("./proxy");
    const request = createRequest("/api/blocks");
    const response = proxy(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("allows authenticated page requests through", async () => {
    const { proxy } = await import("./proxy");
    const token = createSessionToken({
      userId: "user-123",
      email: "admin@test.com",
      expiresAt: Date.now() + 1000 * 60 * 60,
    });
    const request = createRequest("/app/dashboard", token);
    const response = proxy(request);

    expect(response.status).toBe(200);
  });

  it("allows authenticated API requests through", async () => {
    const { proxy } = await import("./proxy");
    const token = createSessionToken({
      userId: "user-123",
      email: "admin@test.com",
      expiresAt: Date.now() + 1000 * 60 * 60,
    });
    const request = createRequest("/api/blocks", token);
    const response = proxy(request);

    expect(response.status).toBe(200);
  });

  it("rejects expired sessions for page routes", async () => {
    const { proxy } = await import("./proxy");
    const token = createSessionToken({
      userId: "user-123",
      email: "admin@test.com",
      expiresAt: Date.now() - 1000, // expired
    });
    const request = createRequest("/app/dashboard", token);
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("rejects expired sessions for API routes", async () => {
    const { proxy } = await import("./proxy");
    const token = createSessionToken({
      userId: "user-123",
      email: "admin@test.com",
      expiresAt: Date.now() - 1000, // expired
    });
    const request = createRequest("/api/blocks", token);
    const response = proxy(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("rejects tampered session tokens", async () => {
    const { proxy } = await import("./proxy");
    const token = createSessionToken({
      userId: "user-123",
      email: "admin@test.com",
      expiresAt: Date.now() + 1000 * 60 * 60,
    });
    // Tamper with the signature
    const tampered = token.slice(0, -3) + "abc";
    const request = createRequest("/app/dashboard", tampered);
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("exports a config with the correct matcher", async () => {
    const { config } = await import("./proxy");
    expect(config.matcher).toEqual([
      "/app/:path*",
      "/settings/:path*",
      "/api/((?!auth).*)",
    ]);
  });
});
