import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchLinkPreview,
  extractOpenGraph,
  extractTwitterCard,
  extractMetaTags,
  extractFavicon,
} from "./preview";

describe("preview", () => {
  describe("extractOpenGraph", () => {
    it("extracts OG title, description, image, and site_name", () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Test Title">
            <meta property="og:description" content="Test Description">
            <meta property="og:image" content="https://example.com/image.png">
            <meta property="og:site_name" content="Example Site">
          </head>
        </html>
      `;
      const result = extractOpenGraph(html);
      expect(result.title).toBe("Test Title");
      expect(result.description).toBe("Test Description");
      expect(result.imageUrl).toBe("https://example.com/image.png");
      expect(result.siteName).toBe("Example Site");
    });

    it("handles content attribute before property attribute", () => {
      const html = `<meta content="Reversed Title" property="og:title">`;
      const result = extractOpenGraph(html);
      expect(result.title).toBe("Reversed Title");
    });

    it("returns undefined for missing OG tags", () => {
      const html = `<html><head><title>No OG</title></head></html>`;
      const result = extractOpenGraph(html);
      expect(result.title).toBeNull();
      expect(result.description).toBeNull();
    });

    it("decodes HTML entities in OG content", () => {
      const html = `<meta property="og:title" content="Tom &amp; Jerry&#39;s &quot;Show&quot;">`;
      const result = extractOpenGraph(html);
      expect(result.title).toBe(`Tom & Jerry's "Show"`);
    });
  });

  describe("extractTwitterCard", () => {
    it("extracts Twitter card metadata", () => {
      const html = `
        <meta name="twitter:title" content="Tweet Title">
        <meta name="twitter:description" content="Tweet Desc">
        <meta name="twitter:image" content="https://example.com/tw.png">
        <meta name="twitter:site" content="@example">
      `;
      const result = extractTwitterCard(html);
      expect(result.title).toBe("Tweet Title");
      expect(result.description).toBe("Tweet Desc");
      expect(result.imageUrl).toBe("https://example.com/tw.png");
      expect(result.siteName).toBe("@example");
    });
  });

  describe("extractMetaTags", () => {
    it("extracts standard meta description", () => {
      const html = `<meta name="description" content="A meta description">`;
      const result = extractMetaTags(html);
      expect(result.description).toBe("A meta description");
    });

    it("extracts meta title", () => {
      const html = `<meta name="title" content="Meta Title">`;
      const result = extractMetaTags(html);
      expect(result.title).toBe("Meta Title");
    });
  });

  describe("extractFavicon", () => {
    it("extracts favicon from link[rel=icon]", () => {
      const html = `<link rel="icon" href="/favicon.png">`;
      const result = extractFavicon("https://example.com", html);
      expect(result).toBe("/favicon.png");
    });

    it("extracts favicon from link[rel=shortcut icon]", () => {
      const html = `<link rel="shortcut icon" href="/icon.ico">`;
      const result = extractFavicon("https://example.com", html);
      expect(result).toBe("/icon.ico");
    });

    it("handles href before rel attribute order", () => {
      const html = `<link href="/my-icon.png" rel="icon">`;
      const result = extractFavicon("https://example.com", html);
      expect(result).toBe("/my-icon.png");
    });

    it("returns null when no favicon link is found", () => {
      const html = `<link rel="stylesheet" href="/style.css">`;
      const result = extractFavicon("https://example.com", html);
      expect(result).toBeNull();
    });
  });

  describe("fetchLinkPreview", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns full preview from OG tags", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="My Page">
            <meta property="og:description" content="Page description">
            <meta property="og:image" content="https://example.com/img.jpg">
            <meta property="og:site_name" content="Example">
            <link rel="icon" href="/fav.png">
          </head>
        </html>
      `;

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: () => Promise.resolve(html),
      });

      const result = await fetchLinkPreview("https://example.com/page");
      expect(result.title).toBe("My Page");
      expect(result.description).toBe("Page description");
      expect(result.imageUrl).toBe("https://example.com/img.jpg");
      expect(result.siteName).toBe("Example");
      expect(result.faviconUrl).toBe("https://example.com/fav.png");
      expect(result.domain).toBe("example.com");
      expect(result.contentType).toBe("text/html; charset=utf-8");
    });

    it("falls back to Twitter cards when OG is missing", async () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:title" content="Twitter Title">
            <meta name="twitter:description" content="Twitter Desc">
          </head>
        </html>
      `;

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        headers: new Headers({ "content-type": "text/html" }),
        text: () => Promise.resolve(html),
      });

      const result = await fetchLinkPreview("https://example.com");
      expect(result.title).toBe("Twitter Title");
      expect(result.description).toBe("Twitter Desc");
    });

    it("falls back to HTML title when no meta tags present", async () => {
      const html = `<html><head><title>Plain Title</title></head></html>`;

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        headers: new Headers({ "content-type": "text/html" }),
        text: () => Promise.resolve(html),
      });

      const result = await fetchLinkPreview("https://example.com");
      expect(result.title).toBe("Plain Title");
      expect(result.description).toBeNull();
    });

    it("returns fallback on fetch failure", async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error")
      );

      const result = await fetchLinkPreview("https://example.com/page");
      expect(result.title).toBeNull();
      expect(result.description).toBeNull();
      expect(result.imageUrl).toBeNull();
      expect(result.faviconUrl).toBe("https://example.com/favicon.ico");
      expect(result.domain).toBe("example.com");
      expect(result.contentType).toBeNull();
    });

    it("returns fallback with contentType for non-HTML responses", async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        headers: new Headers({ "content-type": "application/pdf" }),
        text: () => Promise.resolve(""),
      });

      const result = await fetchLinkPreview("https://example.com/doc.pdf");
      expect(result.contentType).toBe("application/pdf");
      expect(result.title).toBeNull();
      expect(result.domain).toBe("example.com");
    });

    it("resolves relative image URLs", async () => {
      const html = `
        <meta property="og:title" content="Test">
        <meta property="og:image" content="/images/hero.jpg">
      `;

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        headers: new Headers({ "content-type": "text/html" }),
        text: () => Promise.resolve(html),
      });

      const result = await fetchLinkPreview("https://example.com/page");
      expect(result.imageUrl).toBe("https://example.com/images/hero.jpg");
    });

    it("resolves protocol-relative image URLs", async () => {
      const html = `
        <meta property="og:image" content="//cdn.example.com/img.png">
      `;

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        headers: new Headers({ "content-type": "text/html" }),
        text: () => Promise.resolve(html),
      });

      const result = await fetchLinkPreview("https://example.com/page");
      expect(result.imageUrl).toBe("https://cdn.example.com/img.png");
    });

    it("handles URLs without protocol", async () => {
      const html = `<html><head><title>No Proto</title></head></html>`;

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        headers: new Headers({ "content-type": "text/html" }),
        text: () => Promise.resolve(html),
      });

      const result = await fetchLinkPreview("example.com/page");
      expect(result.title).toBe("No Proto");
      expect(result.domain).toBe("example.com");
    });

    it("falls back to /favicon.ico when no favicon link in HTML", async () => {
      const html = `<html><head><title>No Favicon</title></head></html>`;

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        headers: new Headers({ "content-type": "text/html" }),
        text: () => Promise.resolve(html),
      });

      const result = await fetchLinkPreview("https://example.com/page");
      expect(result.faviconUrl).toBe("https://example.com/favicon.ico");
    });
  });
});
