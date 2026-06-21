import { db } from "@/db";
import {
  blocks,
  channels,
  tags,
  collections,
  channelBlocks,
  blockTags,
  graphEdges,
} from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

interface GraphNode {
  id: string;
  type: "BLOCK" | "CHANNEL" | "TAG" | "COLLECTION";
  label: string;
  metadata: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  edgeType: string;
  weight: number;
  reason: string;
}

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionFilter = searchParams.get("collection");
    const channelFilter = searchParams.get("channel");
    const tagFilter = searchParams.get("tag");
    const minWeightParam = searchParams.get("minWeight");
    const minWeight = minWeightParam ? parseInt(minWeightParam, 10) : null;

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Determine which blocks/channels/tags/collections to include based on filters
    let filteredBlockIds: string[] | null = null;
    let filteredChannelIds: string[] | null = null;

    if (collectionFilter) {
      // Only show channels in that collection and blocks in those channels
      const collChannels = await db
        .select()
        .from(channels)
        .where(eq(channels.collectionId, collectionFilter));

      filteredChannelIds = collChannels.map((c) => c.id);

      // Get the collection itself
      const [coll] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, collectionFilter))
        .limit(1);

      if (coll) {
        nodes.push({
          id: coll.id,
          type: "COLLECTION",
          label: coll.name,
          metadata: { slug: coll.slug, color: coll.color, icon: coll.icon },
        });
      }

      // Add channel nodes
      for (const ch of collChannels) {
        nodes.push({
          id: ch.id,
          type: "CHANNEL",
          label: ch.name,
          metadata: { slug: ch.slug, collectionId: ch.collectionId },
        });
      }

      // Get blocks in those channels
      if (filteredChannelIds.length > 0) {
        const cbs = await db
          .select()
          .from(channelBlocks)
          .where(inArray(channelBlocks.channelId, filteredChannelIds));

        filteredBlockIds = [...new Set(cbs.map((cb) => cb.blockId))];
      } else {
        filteredBlockIds = [];
      }
    } else if (channelFilter) {
      // Only show blocks in that channel
      filteredChannelIds = [channelFilter];

      const [ch] = await db
        .select()
        .from(channels)
        .where(eq(channels.id, channelFilter))
        .limit(1);

      if (ch) {
        nodes.push({
          id: ch.id,
          type: "CHANNEL",
          label: ch.name,
          metadata: { slug: ch.slug, collectionId: ch.collectionId },
        });
      }

      const cbs = await db
        .select()
        .from(channelBlocks)
        .where(eq(channelBlocks.channelId, channelFilter));

      filteredBlockIds = cbs.map((cb) => cb.blockId);
    } else if (tagFilter) {
      // Only show blocks with that tag
      const [t] = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tagFilter))
        .limit(1);

      if (t) {
        nodes.push({
          id: t.id,
          type: "TAG",
          label: t.name,
          metadata: { slug: t.slug },
        });
      }

      const bts = await db
        .select()
        .from(blockTags)
        .where(eq(blockTags.tagId, tagFilter));

      filteredBlockIds = bts.map((bt) => bt.blockId);
    }

    // Fetch and add block nodes
    if (filteredBlockIds !== null) {
      if (filteredBlockIds.length > 0) {
        const blockRows = await db
          .select()
          .from(blocks)
          .where(inArray(blocks.id, filteredBlockIds));

        for (const b of blockRows) {
          nodes.push({
            id: b.id,
            type: "BLOCK",
            label: b.title || b.content?.substring(0, 50) || b.id,
            metadata: {
              type: b.type,
              domain: b.domain,
              url: b.url,
            },
          });
        }
      }
    } else {
      // No filter — return ALL nodes
      const allBlocks = await db.select().from(blocks);
      for (const b of allBlocks) {
        nodes.push({
          id: b.id,
          type: "BLOCK",
          label: b.title || b.content?.substring(0, 50) || b.id,
          metadata: {
            type: b.type,
            domain: b.domain,
            url: b.url,
          },
        });
      }

      const allChannels = await db.select().from(channels);
      for (const ch of allChannels) {
        nodes.push({
          id: ch.id,
          type: "CHANNEL",
          label: ch.name,
          metadata: { slug: ch.slug, collectionId: ch.collectionId },
        });
      }

      const allTags = await db.select().from(tags);
      for (const t of allTags) {
        nodes.push({
          id: t.id,
          type: "TAG",
          label: t.name,
          metadata: { slug: t.slug },
        });
      }

      const allCollections = await db.select().from(collections);
      for (const c of allCollections) {
        nodes.push({
          id: c.id,
          type: "COLLECTION",
          label: c.name,
          metadata: { slug: c.slug, color: c.color, icon: c.icon },
        });
      }
    }

    // Build a set of node IDs for edge filtering
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Build structural edges
    // BLOCK_IN_CHANNEL edges from channel_blocks
    const allChannelBlocks = await db.select().from(channelBlocks);
    for (const cb of allChannelBlocks) {
      if (nodeIds.has(cb.blockId) && nodeIds.has(cb.channelId)) {
        edges.push({
          id: cb.id,
          source: cb.blockId,
          target: cb.channelId,
          edgeType: "BLOCK_IN_CHANNEL",
          weight: 1,
          reason: "Block belongs to channel",
        });
      }
    }

    // BLOCK_HAS_TAG edges from block_tags
    const allBlockTags = await db.select().from(blockTags);
    for (const bt of allBlockTags) {
      if (nodeIds.has(bt.blockId) && nodeIds.has(bt.tagId)) {
        edges.push({
          id: bt.id,
          source: bt.blockId,
          target: bt.tagId,
          edgeType: "BLOCK_HAS_TAG",
          weight: 1,
          reason: "Block has tag",
        });
      }
    }

    // CHANNEL_IN_COLLECTION edges from channels with collectionId
    const allChannelsForEdges = await db.select().from(channels);
    for (const ch of allChannelsForEdges) {
      if (ch.collectionId && nodeIds.has(ch.id) && nodeIds.has(ch.collectionId)) {
        edges.push({
          id: `${ch.id}_in_${ch.collectionId}`,
          source: ch.id,
          target: ch.collectionId,
          edgeType: "CHANNEL_IN_COLLECTION",
          weight: 1,
          reason: "Channel belongs to collection",
        });
      }
    }

    // RELATED edges from graph_edges table
    const allGraphEdges = await db.select().from(graphEdges);
    for (const ge of allGraphEdges) {
      if (!nodeIds.has(ge.sourceId) || !nodeIds.has(ge.targetId)) {
        continue;
      }
      if (minWeight !== null && ge.weight < minWeight) {
        continue;
      }
      edges.push({
        id: ge.id,
        source: ge.sourceId,
        target: ge.targetId,
        edgeType: ge.edgeType,
        weight: ge.weight,
        reason: ge.reason || "",
      });
    }

    // Apply minWeight filter to structural edges too if specified
    const filteredEdges = minWeight !== null
      ? edges.filter((e) => e.weight >= minWeight)
      : edges;

    return Response.json({ nodes, edges: filteredEdges });
  } catch (error) {
    console.error("Graph fetch error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
