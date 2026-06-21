/**
 * Graph Engine
 *
 * Automatically generates relationship edges between blocks based on
 * shared channels, tags, domains, keywords, and temporal proximity.
 * No AI dependencies — uses rule-based scoring.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  blocks,
  channelBlocks,
  blockTags,
  tags,
  channels,
  graphEdges,
} from "@/db/schema";
import { generateId, now } from "@/lib/utils";
import { GRAPH_SCORING, EDGE_TYPES, NODE_TYPES } from "@/lib/constants";

export interface EdgeCandidate {
  targetBlockId: string;
  score: number;
  reasons: string[];
  edgeType: string; // strongest reason type
}

interface BlockWithContext {
  id: string;
  domain: string | null;
  extractedKeywords: string | null;
  createdAt: number;
  channelIds: string[];
  channelNames: string[];
  tagIds: string[];
  tagNames: string[];
}

/**
 * Calculates the relationship score between two blocks.
 *
 * Scoring model:
 * - Same channel: +5 per shared channel
 * - Same tag: +4 per shared tag
 * - Same domain: +2
 * - Shared keyword: +2 per keyword (max 5 keywords = +10)
 * - Created within 7-day window: +1
 */
export function calculateBlockRelationScore(
  blockA: BlockWithContext,
  blockB: BlockWithContext
): EdgeCandidate {
  let score = 0;
  const reasons: string[] = [];
  const factorScores: { type: string; score: number }[] = [];

  // Shared channels: +5 per shared channel
  const sharedChannelIds = blockA.channelIds.filter((id) =>
    blockB.channelIds.includes(id)
  );
  if (sharedChannelIds.length > 0) {
    const channelScore = sharedChannelIds.length * GRAPH_SCORING.SAME_CHANNEL;
    score += channelScore;
    // Get channel names for the shared channels
    const sharedChannelNames = blockA.channelNames.filter((_, idx) =>
      sharedChannelIds.includes(blockA.channelIds[idx])
    );
    const channelList = sharedChannelNames.map((n) => `'${n}'`).join(", ");
    reasons.push(
      sharedChannelIds.length === 1
        ? `Both blocks are in the channel ${channelList}`
        : `Both blocks are in the channels ${channelList}`
    );
    factorScores.push({
      type: EDGE_TYPES.RELATED_BY_SHARED_CHANNEL,
      score: channelScore,
    });
  }

  // Shared tags: +4 per shared tag
  const sharedTagIds = blockA.tagIds.filter((id) =>
    blockB.tagIds.includes(id)
  );
  if (sharedTagIds.length > 0) {
    const tagScore = sharedTagIds.length * GRAPH_SCORING.SAME_TAG;
    score += tagScore;
    const sharedTagNames = blockA.tagNames.filter((_, idx) =>
      sharedTagIds.includes(blockA.tagIds[idx])
    );
    const tagList = sharedTagNames.map((n) => `#${n}`).join(", ");
    reasons.push(`They share tags: ${tagList}`);
    factorScores.push({
      type: EDGE_TYPES.RELATED_BY_SHARED_TAG,
      score: tagScore,
    });
  }

  // Same domain: +2
  if (
    blockA.domain &&
    blockB.domain &&
    blockA.domain === blockB.domain
  ) {
    score += GRAPH_SCORING.SAME_DOMAIN;
    reasons.push(`Both links come from ${blockA.domain}`);
    factorScores.push({
      type: EDGE_TYPES.RELATED_BY_SHARED_DOMAIN,
      score: GRAPH_SCORING.SAME_DOMAIN,
    });
  }

  // Shared keywords: +2 per keyword, max 5
  const keywordsA = parseKeywords(blockA.extractedKeywords);
  const keywordsB = parseKeywords(blockB.extractedKeywords);
  const sharedKeywords = keywordsA.filter((kw) => keywordsB.includes(kw));
  const cappedKeywords = sharedKeywords.slice(0, 5);
  if (cappedKeywords.length > 0) {
    const kwScore = cappedKeywords.length * GRAPH_SCORING.SHARED_KEYWORD;
    score += kwScore;
    const kwList = cappedKeywords.map((kw) => `"${kw}"`).join(", ");
    reasons.push(`Shared keywords: ${kwList}`);
    factorScores.push({
      type: EDGE_TYPES.RELATED_BY_KEYWORD_OVERLAP,
      score: kwScore,
    });
  }

  // Created within 7-day window: +1
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  if (Math.abs(blockA.createdAt - blockB.createdAt) <= SEVEN_DAYS_MS) {
    score += GRAPH_SCORING.SAME_WEEK;
    reasons.push("Created within the same week");
    // Temporal proximity doesn't determine edge type
  }

  // Determine strongest edge type
  let edgeType: string = EDGE_TYPES.RELATED_BY_KEYWORD_OVERLAP; // default
  if (factorScores.length > 0) {
    factorScores.sort((a, b) => b.score - a.score);
    edgeType = factorScores[0].type;
  }

  return {
    targetBlockId: blockB.id,
    score,
    reasons,
    edgeType,
  };
}

/**
 * Generates graph edges for a specific block against all other blocks.
 * Filters candidates by MIN_SCORE_THRESHOLD, keeps top MAX_AUTO_EDGES_PER_BLOCK.
 * Upserts graph_edges records.
 */
export async function generateGraphEdgesForBlock(
  blockId: string
): Promise<void> {
  // Get the target block with its context
  const targetBlock = await getBlockWithContext(blockId);
  if (!targetBlock) return;

  // Get all other blocks with their context
  const allBlocks = await getAllBlocksWithContext();
  const otherBlocks = allBlocks.filter((b) => b.id !== blockId);

  // Calculate scores
  const candidates: EdgeCandidate[] = [];
  for (const otherBlock of otherBlocks) {
    const candidate = calculateBlockRelationScore(targetBlock, otherBlock);
    if (candidate.score >= GRAPH_SCORING.MIN_SCORE_THRESHOLD) {
      candidates.push(candidate);
    }
  }

  // Sort by score descending, keep top N
  candidates.sort((a, b) => b.score - a.score);
  const topCandidates = candidates.slice(
    0,
    GRAPH_SCORING.MAX_AUTO_EDGES_PER_BLOCK
  );

  // Upsert edges
  const timestamp = now();
  for (const candidate of topCandidates) {
    const reason = formatEdgeReason(candidate.reasons);

    // Use INSERT OR REPLACE via raw SQL to handle the unique constraint
    await db
      .insert(graphEdges)
      .values({
        id: generateId(),
        sourceType: NODE_TYPES.BLOCK,
        sourceId: blockId,
        targetType: NODE_TYPES.BLOCK,
        targetId: candidate.targetBlockId,
        edgeType: candidate.edgeType,
        weight: candidate.score,
        reason,
        isAutoGenerated: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: [
          graphEdges.sourceType,
          graphEdges.sourceId,
          graphEdges.targetType,
          graphEdges.targetId,
          graphEdges.edgeType,
        ],
        set: {
          weight: candidate.score,
          reason,
          updatedAt: timestamp,
        },
      });
  }
}

/**
 * Rebuilds all auto-generated graph edges.
 * Deletes all auto-generated edges, then regenerates for every block.
 * Manual edges (isAutoGenerated = 0) are preserved.
 */
export async function rebuildAllGraphEdges(): Promise<void> {
  // Delete all auto-generated edges
  await db
    .delete(graphEdges)
    .where(eq(graphEdges.isAutoGenerated, 1));

  // Get all block IDs
  const allBlocks = await db.select({ id: blocks.id }).from(blocks);

  // Regenerate edges for each block
  for (const block of allBlocks) {
    await generateGraphEdgesForBlock(block.id);
  }
}

/**
 * Formats an array of individual reasons into a single human-readable string.
 */
export function formatEdgeReason(reasons: string[]): string {
  if (reasons.length === 0) return "";
  return reasons.join(". ") + ".";
}

// --- Internal Helpers ---

function parseKeywords(keywordsJson: string | null): string[] {
  if (!keywordsJson) return [];
  try {
    const parsed = JSON.parse(keywordsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getBlockWithContext(
  blockId: string
): Promise<BlockWithContext | null> {
  // Get the block
  const [block] = await db
    .select({
      id: blocks.id,
      domain: blocks.domain,
      extractedKeywords: blocks.extractedKeywords,
      createdAt: blocks.createdAt,
    })
    .from(blocks)
    .where(eq(blocks.id, blockId));

  if (!block) return null;

  // Get channels for this block
  const blockChannels = await db
    .select({
      channelId: channelBlocks.channelId,
      channelName: channels.name,
    })
    .from(channelBlocks)
    .innerJoin(channels, eq(channelBlocks.channelId, channels.id))
    .where(eq(channelBlocks.blockId, blockId));

  // Get tags for this block
  const blockTagRecords = await db
    .select({
      tagId: blockTags.tagId,
      tagName: tags.name,
    })
    .from(blockTags)
    .innerJoin(tags, eq(blockTags.tagId, tags.id))
    .where(eq(blockTags.blockId, blockId));

  return {
    id: block.id,
    domain: block.domain,
    extractedKeywords: block.extractedKeywords,
    createdAt: block.createdAt,
    channelIds: blockChannels.map((c) => c.channelId),
    channelNames: blockChannels.map((c) => c.channelName),
    tagIds: blockTagRecords.map((t) => t.tagId),
    tagNames: blockTagRecords.map((t) => t.tagName),
  };
}

async function getAllBlocksWithContext(): Promise<BlockWithContext[]> {
  // Get all blocks
  const allBlocks = await db
    .select({
      id: blocks.id,
      domain: blocks.domain,
      extractedKeywords: blocks.extractedKeywords,
      createdAt: blocks.createdAt,
    })
    .from(blocks);

  // Get all channel-block associations
  const allChannelBlocks = await db
    .select({
      blockId: channelBlocks.blockId,
      channelId: channelBlocks.channelId,
      channelName: channels.name,
    })
    .from(channelBlocks)
    .innerJoin(channels, eq(channelBlocks.channelId, channels.id));

  // Get all block-tag associations
  const allBlockTags = await db
    .select({
      blockId: blockTags.blockId,
      tagId: blockTags.tagId,
      tagName: tags.name,
    })
    .from(blockTags)
    .innerJoin(tags, eq(blockTags.tagId, tags.id));

  // Build context map
  return allBlocks.map((block) => {
    const blockChannelRecords = allChannelBlocks.filter(
      (cb) => cb.blockId === block.id
    );
    const blockTagRecords = allBlockTags.filter(
      (bt) => bt.blockId === block.id
    );

    return {
      id: block.id,
      domain: block.domain,
      extractedKeywords: block.extractedKeywords,
      createdAt: block.createdAt,
      channelIds: blockChannelRecords.map((c) => c.channelId),
      channelNames: blockChannelRecords.map((c) => c.channelName),
      tagIds: blockTagRecords.map((t) => t.tagId),
      tagNames: blockTagRecords.map((t) => t.tagName),
    };
  });
}
