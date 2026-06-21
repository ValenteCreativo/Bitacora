import { describe, it, expect } from "vitest";
import { normalizeUrl, extractDomain } from "./normalize-url";

describe("normalizeUrl", () => {
  it("strips trailing slash", () => {
    expect(normalizeUrl("https://example.com/path/")).toBe(
      "https://example.com/path"
    );
  });

  it("strips www", () => {
    expect(normalizeUrl("https://www.example.com")).toBe(
      "https://example.com"
    );
  });

  it("strips fragment/hash", () => {
    expect(normalizeUrl("https://example.com/page#section")).toBe(
      "https://example.com/page"
    );
  });

  it("sorts query parameters", () => {
    expect(normalizeUrl("https://example.com?b=2&a=1")).toBe(
      "https://example.com/?a=1&b=2"
    );
  });

  it("removes default port 443 for https", () => {
    expect(normalizeUrl("https://example.com:443/path")).toBe(
      "https://example.com/path"
    );
  });

  it("removes default port 80 for http", () => {
    expect(normalizeUrl("http://example.com:80/path")).toBe(
      "http://example.com/path"
    );
  });

  it("adds default protocol (https) when missing", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });

  it("removes directory index", () => {
    expect(normalizeUrl("https://example.com/path/index.html")).toBe(
      "https://example.com/path"
    );
  });

  it("is idempotent", () => {
    const url = "https://www.example.com/path/?b=2&a=1#hash";
    const first = normalizeUrl(url);
    const second = normalizeUrl(first);
    expect(first).toBe(second);
  });

  it("returns original URL on invalid input", () => {
    expect(normalizeUrl("")).toBe("");
  });

  it("never throws", () => {
    expect(() => normalizeUrl("not a valid url :::")).not.toThrow();
  });
});

describe("extractDomain", () => {
  it("extracts domain from full URL", () => {
    expect(extractDomain("https://example.com/path")).toBe("example.com");
  });

  it("strips www from domain", () => {
    expect(extractDomain("https://www.example.com")).toBe("example.com");
  });

  it("handles URL without protocol", () => {
    expect(extractDomain("example.com/path")).toBe("example.com");
  });

  it("extracts subdomain correctly", () => {
    expect(extractDomain("https://blog.example.com/post")).toBe(
      "blog.example.com"
    );
  });

  it("returns empty string for invalid input", () => {
    expect(extractDomain("")).toBe("");
  });

  it("never throws", () => {
    expect(() => extractDomain(":::invalid")).not.toThrow();
  });
});
