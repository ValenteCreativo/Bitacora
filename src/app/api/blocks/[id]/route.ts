import { db } from "@/db";
import {
  blocks,
  blockTags,
  tags,
  channelBlocks,
  channels,
  graphEdges,
} from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { eq, or } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the block
    const [block] = await db
      .select()
      .from(blocks)
      .where(eq(blocks.id, id))
      .limit(1);

    if (!block) {
      return Response.json({ error: "Block not found" }, { status: 404 });
    }

    // Fetch tags for this block
    const blockTagRows = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(blockTags)
      .innerJoin(tags, eq(blockTags.tagId, tags.id))
      .where(eq(blockTags.blockId, id));

    // Fetch channels for this block
    const blockChannels = await db
      .select({
        id: channels.id,
        name: channels.name,
        slug: channels.slug,
        description: channels.description,
        collectionId: channels.collectionId,
      })
      .from(channelBlocks)
      .innerJoin(channels, eq(channelBlocks.channelId, channels.id))
      .where(eq(channelBlocks.blockId, id));

    // Fetch related blocks via graph edges
    const edges = await db
      .select()
      .from(graphEdges)
      .where(or(eq(graphEdges.sourceId, id), eq(graphEdges.targetId, id)));

    // Collect related block IDs (the "other" side of each edge)
    const relatedBlockIds = new Set<string>();
    for (const edge of edges) {
      if (edge.sourceId === id) {
        relatedBlockIds.add(edge.targetId);
      } else {
        relatedBlockIds.add(edge.sourceId);
      }
    }

    // Fetch related block details
    let relatedBlocks: Array<{
      id: string;
      type: string;
      title: string | null;
      url: string | null;
      edgeType: string;
      weight: number;
      reason: string | null;
    }> = [];

    if (relatedBlockIds.size > 0) {
      const relatedBlockRows = await db
        .select()
        .from(blocks)
        .where(
          or(...Array.from(relatedBlockIds).map((rid) => eq(blocks.id, rid)))
        );

      // Map related blocks with their edge info
      relatedBlocks = relatedBlockRows.map((relBlock) => {
        const edge = edges.find(
          (e) =>
            (e.sourceId === id && e.targetId === relBlock.id) ||
            (e.targetId === id && e.sourceId === relBlock.id)
        );
        return {
          id: relBlock.id,
          type: relBlock.type,
          title: relBlock.title,
          url: relBlock.url,
          edgeType: edge?.edgeType ?? "RELATED",
          weight: edge?.weight ?? 0,
          reason: edge?.reason ?? null,
        };
      });
    }

    return Response.json({
      ...block,
      extractedKeywords: block.extractedKeywords
        ? JSON.parse(block.extractedKeywords)
        : [],
      isFavorite: Boolean(block.isFavorite),
      isArchived: Boolean(block.isArchived),
      tags: blockTagRows,
      channels: blockChannels,
      relatedBlocks,
    });
  } catch (error) {
    console.error("Block get error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
