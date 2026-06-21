import { db } from "@/db";
import { blocks, tags, channels, collections } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { like, or } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return Response.json({
        blocks: [],
        tags: [],
        channels: [],
        collections: [],
      });
    }

    const pattern = `%${q}%`;

    // Search blocks
    const blockResults = await db
      .select()
      .from(blocks)
      .where(
        or(
          like(blocks.title, pattern),
          like(blocks.url, pattern),
          like(blocks.description, pattern),
          like(blocks.content, pattern),
          like(blocks.note, pattern),
          like(blocks.extractedKeywords, pattern)
        )
      )
      .limit(50);

    // Search tags
    const tagResults = await db
      .select()
      .from(tags)
      .where(like(tags.name, pattern))
      .limit(20);

    // Search channels
    const channelResults = await db
      .select()
      .from(channels)
      .where(like(channels.name, pattern))
      .limit(20);

    // Search collections
    const collectionResults = await db
      .select()
      .from(collections)
      .where(like(collections.name, pattern))
      .limit(20);

    return Response.json({
      blocks: blockResults.map((b) => ({
        ...b,
        extractedKeywords: b.extractedKeywords
          ? JSON.parse(b.extractedKeywords)
          : [],
        isFavorite: Boolean(b.isFavorite),
        isArchived: Boolean(b.isArchived),
      })),
      tags: tagResults,
      channels: channelResults,
      collections: collectionResults,
    });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
