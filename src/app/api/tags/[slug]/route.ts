import { db } from "@/db";
import { tags, blockTags, blocks } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Find tag by slug
    const [tag] = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    if (!tag) {
      return Response.json({ error: "Tag not found" }, { status: 404 });
    }

    // Fetch all blocks associated with this tag
    const tagBlocks = await db
      .select({
        id: blocks.id,
        type: blocks.type,
        title: blocks.title,
        content: blocks.content,
        url: blocks.url,
        normalizedUrl: blocks.normalizedUrl,
        description: blocks.description,
        imageUrl: blocks.imageUrl,
        faviconUrl: blocks.faviconUrl,
        siteName: blocks.siteName,
        domain: blocks.domain,
        contentType: blocks.contentType,
        note: blocks.note,
        source: blocks.source,
        extractedKeywords: blocks.extractedKeywords,
        language: blocks.language,
        isFavorite: blocks.isFavorite,
        isArchived: blocks.isArchived,
        createdById: blocks.createdById,
        createdAt: blocks.createdAt,
        updatedAt: blocks.updatedAt,
      })
      .from(blockTags)
      .innerJoin(blocks, eq(blockTags.blockId, blocks.id))
      .where(eq(blockTags.tagId, tag.id));

    // Format blocks
    const formattedBlocks = tagBlocks.map((block) => ({
      ...block,
      extractedKeywords: block.extractedKeywords
        ? JSON.parse(block.extractedKeywords)
        : [],
      isFavorite: Boolean(block.isFavorite),
      isArchived: Boolean(block.isArchived),
    }));

    return Response.json({ tag, blocks: formattedBlocks });
  } catch (error) {
    console.error("Tag detail error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
