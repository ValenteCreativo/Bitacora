/**
 * Keyword Extractor
 *
 * Extracts keywords from text using frequency analysis.
 * No AI dependencies — uses stopword removal and term frequency ranking.
 */

const ENGLISH_STOPWORDS = new Set([
  "the", "is", "at", "which", "on", "a", "an", "and", "or", "but", "in",
  "with", "to", "for", "of", "that", "this", "from", "by", "are", "was",
  "were", "been", "be", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "can", "may", "might", "shall", "its", "it",
  "not", "no", "so", "if", "then", "than", "each", "every", "all", "both",
  "few", "more", "most", "other", "some", "such", "only", "own", "same",
  "very", "just", "also", "about", "over", "after", "before", "between",
  "through", "during", "until", "while", "above", "below", "up", "down",
  "out", "off", "into", "onto",
]);

const SPANISH_STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al",
  "en", "con", "por", "para", "que", "es", "se", "su", "sus", "como", "pero",
  "más", "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
  "hay", "ser", "estar", "tener", "hacer", "ir", "poder", "saber", "ver",
  "dar", "decir", "también", "ya", "muy", "sin", "sobre", "entre", "cuando",
  "donde", "todo", "toda", "todos", "todas", "otro", "otra", "otros", "otras",
  "cada", "mucho", "poco", "algo", "nada",
]);

/**
 * Tokenize text: lowercase, remove punctuation, split on whitespace.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((term) => term.length > 0);
}

/**
 * Remove stopwords from a list of terms.
 * Supports English and Spanish by default.
 */
export function removeStopwords(
  terms: string[],
  languages: string[] = ["en", "es"]
): string[] {
  const stopwords = new Set<string>();

  for (const lang of languages) {
    if (lang === "en") {
      for (const word of ENGLISH_STOPWORDS) stopwords.add(word);
    }
    if (lang === "es") {
      for (const word of SPANISH_STOPWORDS) stopwords.add(word);
    }
  }

  return terms.filter((term) => !stopwords.has(term));
}

/**
 * Rank terms by frequency and return the top N.
 */
export function rankByFrequency(terms: string[], topN: number): string[] {
  const frequency = new Map<string, number>();

  for (const term of terms) {
    frequency.set(term, (frequency.get(term) || 0) + 1);
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([term]) => term);
}

/**
 * Extract keywords from an array of text strings.
 *
 * Process:
 * 1. Concatenate all texts
 * 2. Tokenize (lowercase, remove punctuation, split)
 * 3. Remove English and Spanish stopwords
 * 4. Keep only terms > 3 characters
 * 5. Rank by frequency
 * 6. Return top 5–12 keywords
 *
 * Returns between 0 and 12 keywords sorted by frequency descending.
 */
export function extractKeywords(texts: string[]): string[] {
  const combined = texts.filter(Boolean).join(" ");

  if (combined.trim().length === 0) {
    return [];
  }

  const tokens = tokenize(combined);
  const withoutStopwords = removeStopwords(tokens);
  const filtered = withoutStopwords.filter((term) => term.length > 3);

  if (filtered.length === 0) {
    return [];
  }

  const maxKeywords = 12;
  const ranked = rankByFrequency(filtered, maxKeywords);

  return ranked;
}
