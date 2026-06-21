import { extractDomain } from "@/lib/normalize-url";

export interface LinkPreview {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
  siteName: string | null;
  domain: string;
  contentType: string | null;
}

/**
 * Fetches and extracts link preview metadata from a URL.
 * Uses native fetch with a 5-second timeout.
 * Never throws — returns partial data on failure.
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const domain = extractDomain(url);
  let origin: string;

  try {
    const urlWithProtocol = url.match(/^https?:\/\//) ? url : `https://${url}`;
    origin = new URL(urlWithProtocol).origin;
  } catch {
    origin = "";
  }

  const fallback: LinkPreview = {
    title: null,
    description: null,
    imageUrl: null,
    faviconUrl: origin ? `${origin}/favicon.ico` : null,
    siteName: null,
    domain,
    contentType: null,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      url.match(/^https?:\/\//) ? url : `https://${url}`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Bitacora/1.0; +https://github.com/bitacora)",
          Accept: "text/html, application/xhtml+xml",
        },
        redirect: "follow",
      }
    );

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || null;

    // Only parse HTML responses
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { ...fallback, contentType };
    }

    const html = await response.text();

    // Extract metadata in priority order
    const og = extractOpenGraph(html);
    const twitter = extractTwitterCard(html);
    const meta = extractMetaTags(html);
    const htmlTitle = extractHtmlTitle(html);
    const favicon = extractFavicon(url, html);

    // Merge in priority order: OG → Twitter → meta → HTML title → domain fallback
    const title = og.title || twitter.title || meta.title || htmlTitle || null;
    const description = og.description || twitter.description || meta.description || null;
    const imageUrl = resolveUrl(url, og.imageUrl || twitter.imageUrl || null);
    const siteName = og.siteName || twitter.siteName || null;
    const faviconUrl = favicon ? resolveUrl(url, favicon) : `${origin}/favicon.ico`;

    return {
      title,
      description,
      imageUrl,
      faviconUrl,
      siteName,
      domain,
      contentType,
    };
  } catch {
    return fallback;
  }
}

/**
 * Extracts Open Graph metadata from HTML using regex.
 */
export function extractOpenGraph(html: string): Partial<LinkPreview> {
  return {
    title: getMetaContent(html, "property", "og:title"),
    description: getMetaContent(html, "property", "og:description"),
    imageUrl: getMetaContent(html, "property", "og:image"),
    siteName: getMetaContent(html, "property", "og:site_name"),
  };
}

/**
 * Extracts Twitter Card metadata from HTML using regex.
 */
export function extractTwitterCard(html: string): Partial<LinkPreview> {
  return {
    title: getMetaContent(html, "name", "twitter:title"),
    description: getMetaContent(html, "name", "twitter:description"),
    imageUrl: getMetaContent(html, "name", "twitter:image"),
    siteName: getMetaContent(html, "name", "twitter:site"),
  };
}

/**
 * Extracts standard meta tags from HTML using regex.
 */
export function extractMetaTags(html: string): Partial<LinkPreview> {
  return {
    title: getMetaContent(html, "name", "title"),
    description: getMetaContent(html, "name", "description"),
  };
}

/**
 * Extracts favicon URL from HTML link tags.
 * Falls back to /favicon.ico if not found in HTML.
 */
export function extractFavicon(url: string, html: string): string | null {
  // Match link[rel="icon"] or link[rel="shortcut icon"]
  const faviconRegex = /<link[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*>/gi;
  const matches = html.match(faviconRegex);

  if (matches) {
    for (const match of matches) {
      const href = getAttributeValue(match, "href");
      if (href) {
        return href;
      }
    }
  }

  // Also try rel before href pattern (rel might come after href)
  const altFaviconRegex = /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*>/gi;
  const altMatch = altFaviconRegex.exec(html);
  if (altMatch && altMatch[1]) {
    return altMatch[1];
  }

  return null;
}

/**
 * Extracts the HTML <title> tag content.
 */
function extractHtmlTitle(html: string): string | null {
  const titleRegex = /<title[^>]*>([^<]*)<\/title>/i;
  const match = titleRegex.exec(html);
  if (match && match[1]) {
    return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

/**
 * Gets the content attribute of a meta tag matching the given attribute and value.
 * Handles both attribute-before-content and content-before-attribute patterns.
 */
function getMetaContent(
  html: string,
  attr: "property" | "name",
  value: string
): string | null {
  // Pattern 1: attribute before content
  // e.g., <meta property="og:title" content="...">
  const regex1 = new RegExp(
    `<meta[^>]*${attr}=["']${escapeRegex(value)}["'][^>]*content=["']([^"']*)["'][^>]*/?>`,
    "i"
  );
  const match1 = regex1.exec(html);
  if (match1 && match1[1]) {
    return decodeHtmlEntities(match1[1].trim());
  }

  // Pattern 2: content before attribute
  // e.g., <meta content="..." property="og:title">
  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${escapeRegex(value)}["'][^>]*/?>`,
    "i"
  );
  const match2 = regex2.exec(html);
  if (match2 && match2[1]) {
    return decodeHtmlEntities(match2[1].trim());
  }

  return null;
}

/**
 * Extracts the value of an HTML attribute from a tag string.
 */
function getAttributeValue(tag: string, attribute: string): string | null {
  const regex = new RegExp(`${attribute}=["']([^"']*)["']`, "i");
  const match = regex.exec(tag);
  return match ? match[1] : null;
}

/**
 * Resolves a potentially relative URL against a base URL.
 * Returns null if the input is null.
 */
function resolveUrl(baseUrl: string, relativeUrl: string | null): string | null {
  if (!relativeUrl) return null;

  // Already absolute
  if (relativeUrl.match(/^https?:\/\//)) {
    return relativeUrl;
  }

  // Protocol-relative
  if (relativeUrl.startsWith("//")) {
    return `https:${relativeUrl}`;
  }

  try {
    const base = baseUrl.match(/^https?:\/\//) ? baseUrl : `https://${baseUrl}`;
    return new URL(relativeUrl, base).href;
  } catch {
    return relativeUrl;
  }
}

/**
 * Decodes common HTML entities.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&apos;/g, "'");
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
