/**
 * Auto-categorization Suggestions
 *
 * Suggests channels and tags for a block based on keyword matching
 * against existing channel names/descriptions and tag names.
 */

import { db } from "@/db";
import { channels, tags } from "@/db/schema";

export interface ChannelSuggestion {
  id: string;
  name: string;
  slug: string;
  score: number;
}

export interface TagSuggestion {
  id: string;
  name: string;
  slug: string;
  score: number;
}

/**
 * Suggests channels based on keyword overlap with channel names and descriptions.
 * Compares lowercased keywords against tokenized channel name and description.
 * Returns up to 5 suggestions sorted by score descending.
 */
export async function suggestChannels(keywords: string[]): Promise<ChannelSuggestion[]> {
  if (keywords.length === 0) return [];

  const normalizedKeywords = keywords.map((kw) => kw.toLowerCase());
  const allChannels = await db.select().from(channels);

  const suggestions: ChannelSuggestion[] = [];

  for (const channel of allChannels) {
    const nameTokens = channel.name.toLowerCase().split(/\s+/);
    const descTokens = (channel.description || "").toLowerCase().split(/\s+/);
    const allTokens = [...nameTokens, ...descTokens];

    let score = 0;
    for (const kw of normalizedKeywords) {
      if (allTokens.some((token) => token.includes(kw) || kw.includes(token))) {
        score++;
      }
    }

    if (score > 0) {
      suggestions.push({ id: channel.id, name: channel.name, slug: channel.slug, score });
    }
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Suggests tags based on keyword match with existing tag names.
 * Compares lowercased keywords against tag names using substring matching.
 * Returns up to 10 suggestions sorted by score descending.
 */
export async function suggestTags(keywords: string[]): Promise<TagSuggestion[]> {
  if (keywords.length === 0) return [];

  const normalizedKeywords = keywords.map((kw) => kw.toLowerCase());
  const allTags = await db.select().from(tags);

  const suggestions: TagSuggestion[] = [];

  for (const tag of allTags) {
    const tagNameLower = tag.name.toLowerCase();
    let score = 0;

    for (const kw of normalizedKeywords) {
      if (tagNameLower.includes(kw) || kw.includes(tagNameLower)) {
        score++;
      }
    }

    if (score > 0) {
      suggestions.push({ id: tag.id, name: tag.name, slug: tag.slug, score });
    }
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
}
