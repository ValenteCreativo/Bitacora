import normalizeUrlLib from "normalize-url";

/**
 * Normalizes a URL for deduplication purposes.
 * Strips fragments, www, trailing slashes, default ports, and sorts query params.
 * Never throws — returns the original URL on failure.
 */
export function normalizeUrl(url: string): string {
  try {
    return normalizeUrlLib(url, {
      stripHash: true,
      stripWWW: true,
      removeTrailingSlash: true,
      sortQueryParameters: true,
      removeDirectoryIndex: true,
      defaultProtocol: "https",
    });
  } catch {
    return url;
  }
}

/**
 * Extracts the domain (hostname without www.) from a URL.
 * Returns empty string if parsing fails.
 */
export function extractDomain(url: string): string {
  try {
    // Ensure the URL has a protocol for the URL constructor
    const urlWithProtocol = url.match(/^https?:\/\//) ? url : `https://${url}`;
    const parsed = new URL(urlWithProtocol);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
