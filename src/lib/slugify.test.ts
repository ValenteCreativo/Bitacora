import { describe, it, expect } from "vitest";
import { slugify, generateUniqueSlug } from "./slugify";

describe("slugify", () => {
  it("converts basic text to a slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("handles accented characters", () => {
    expect(slugify("Música")).toBe("musica");
    expect(slugify("Investigación")).toBe("investigacion");
    expect(slugify("Café con leche")).toBe("cafe-con-leche");
    expect(slugify("Ñandú veloz")).toBe("nandu-veloz");
  });

  it("replaces multiple spaces and special chars with a single hyphen", () => {
    expect(slugify("hello   world")).toBe("hello-world");
    expect(slugify("foo---bar")).toBe("foo-bar");
    expect(slugify("one & two @ three")).toBe("one-two-three");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
    expect(slugify("---hello---")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles strings with only special characters", () => {
    expect(slugify("!@#$%")).toBe("");
  });

  it("handles numbers", () => {
    expect(slugify("Chapter 1: Introduction")).toBe("chapter-1-introduction");
  });
});

describe("generateUniqueSlug", () => {
  it("returns base slug when no conflicts exist", () => {
    expect(generateUniqueSlug("Hello World", [])).toBe("hello-world");
    expect(generateUniqueSlug("Hello World", ["other-slug"])).toBe(
      "hello-world"
    );
  });

  it("appends -1 when base slug conflicts", () => {
    expect(generateUniqueSlug("Hello World", ["hello-world"])).toBe(
      "hello-world-1"
    );
  });

  it("increments suffix until unique", () => {
    const existing = ["hello-world", "hello-world-1", "hello-world-2"];
    expect(generateUniqueSlug("Hello World", existing)).toBe("hello-world-3");
  });

  it("handles accented text with conflicts", () => {
    expect(generateUniqueSlug("Música", ["musica"])).toBe("musica-1");
  });
});
