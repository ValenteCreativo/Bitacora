import { describe, it, expect } from "vitest";
import {
  extractKeywords,
  tokenize,
  removeStopwords,
  rankByFrequency,
} from "./keywords";

describe("tokenize", () => {
  it("lowercases text", () => {
    expect(tokenize("Hello World")).toEqual(["hello", "world"]);
  });

  it("removes punctuation", () => {
    expect(tokenize("hello, world! foo-bar")).toEqual([
      "hello",
      "world",
      "foo",
      "bar",
    ]);
  });

  it("splits on whitespace", () => {
    expect(tokenize("one  two\tthree\nfour")).toEqual([
      "one",
      "two",
      "three",
      "four",
    ]);
  });

  it("handles empty string", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("removeStopwords", () => {
  it("removes English stopwords", () => {
    const terms = ["the", "quick", "brown", "fox", "is", "very", "fast"];
    const result = removeStopwords(terms, ["en"]);
    expect(result).toEqual(["quick", "brown", "fox", "fast"]);
  });

  it("removes Spanish stopwords", () => {
    const terms = ["el", "gato", "es", "muy", "rápido", "para", "correr"];
    const result = removeStopwords(terms, ["es"]);
    expect(result).toEqual(["gato", "rápido", "correr"]);
  });

  it("removes both English and Spanish stopwords by default", () => {
    const terms = ["the", "el", "project", "es", "for", "developers"];
    const result = removeStopwords(terms);
    expect(result).toEqual(["project", "developers"]);
  });
});

describe("rankByFrequency", () => {
  it("returns terms sorted by frequency descending", () => {
    const terms = ["apple", "banana", "apple", "cherry", "banana", "apple"];
    const result = rankByFrequency(terms, 3);
    expect(result).toEqual(["apple", "banana", "cherry"]);
  });

  it("limits to topN results", () => {
    const terms = ["a", "b", "c", "d", "e"];
    const result = rankByFrequency(terms, 2);
    expect(result).toHaveLength(2);
  });

  it("handles empty input", () => {
    expect(rankByFrequency([], 5)).toEqual([]);
  });
});

describe("extractKeywords", () => {
  it("extracts keywords from title and description", () => {
    const texts = [
      "Machine Learning Tutorial",
      "A comprehensive guide to machine learning algorithms and neural networks",
    ];
    const keywords = extractKeywords(texts);
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords).toContain("machine");
    expect(keywords).toContain("learning");
  });

  it("removes English stopwords from results", () => {
    const texts = ["The quick brown fox jumps over the lazy dogs"];
    const keywords = extractKeywords(texts);
    expect(keywords).not.toContain("the");
    expect(keywords).not.toContain("over");
  });

  it("removes Spanish stopwords from results", () => {
    const texts = [
      "El proyecto para investigación ambiental sobre sensores remotos",
    ];
    const keywords = extractKeywords(texts);
    expect(keywords).not.toContain("el");
    expect(keywords).not.toContain("para");
    expect(keywords).not.toContain("sobre");
  });

  it("filters out terms with 3 or fewer characters", () => {
    const texts = ["The big red car has two old map key run set"];
    const keywords = extractKeywords(texts);
    for (const kw of keywords) {
      expect(kw.length).toBeGreaterThan(3);
    }
  });

  it("returns maximum 12 keywords", () => {
    const texts = [
      "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu",
    ];
    const keywords = extractKeywords(texts);
    expect(keywords.length).toBeLessThanOrEqual(12);
  });

  it("is deterministic — same input always produces same output", () => {
    const texts = [
      "TypeScript React Next.js Development",
      "Building modern applications with TypeScript and React framework",
    ];
    const result1 = extractKeywords(texts);
    const result2 = extractKeywords(texts);
    const result3 = extractKeywords(texts);
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  it("returns empty array for empty input", () => {
    expect(extractKeywords([])).toEqual([]);
    expect(extractKeywords([""])).toEqual([]);
    expect(extractKeywords(["", ""])).toEqual([]);
  });

  it("returns all lowercase keywords", () => {
    const texts = ["JavaScript TypeScript Programming REACT Angular"];
    const keywords = extractKeywords(texts);
    for (const kw of keywords) {
      expect(kw).toEqual(kw.toLowerCase());
    }
  });

  it("keywords contain no punctuation", () => {
    const texts = ["Hello, World! How's the programming going? It's great."];
    const keywords = extractKeywords(texts);
    for (const kw of keywords) {
      expect(kw).toMatch(/^[\p{L}\p{N}]+$/u);
    }
  });
});
