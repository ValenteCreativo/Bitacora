import { db } from "@/db";
import {
  blocks,
  channelBlocks,
  tags,
  blockTags,
} from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { isValidUrl, generateId, now } from "@/lib/utils";
import { normalizeUrl, extractDomain } from "@/lib/normalize-url";
import { extractKeywords } from "@/lib/keywords";
import { slugify } from "@/lib/slugify";
import { BLOCK_TYPES } from "@/lib/constants";
import { eq, desc, and, sql, max } from "drizzle-orm";

interface CreateBlockInput {
  input: string;
  type?: "LINK" | "TEXT";
  channelIds?: string[];
  tagNames?: string[];
  note?: string;
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateBlockInput;
    const { input, channelIds, tagNames, note } = body;

    if (!input || input.trim().length === 0) {
      return Response.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    // Detect type
    const detectedType =
      body.type || (isValidUrl(input) ? BLOCK_TYPES.LINK : BLOCK_TYPES.TEXT);

    const blockId = generateId();
    const timestamp = now();

    let title: string | null = null;
    let content: string | null = null;
    let url: string | null = null;
    let normalizedUrlValue: string | null = null;
    let description: string | null = null;
    let imageUrl: string | null = null;
    let faviconUrl: string | null = null;
    let siteName: string | null = null;
    let domain: string | null = null;
    let contentType: string | null = null;
    let extractedKeywords: string[] = [];

    if (detectedType === BLOCK_TYPES.LINK) {
      // Normalize URL
      url = input;
      normalizedUrlValue = normalizeUrl(input);
      domain = extractDomain(input);

      // Check for duplicates
      const [existing] = await db
        .select({ id: blocks.id })
        .from(blocks)
        .where(eq(blocks.normalizedUrl, normalizedUrlValue))
        .limit(1);

      if (existing) {
        return Response.json(
          {
            error: "Block with this URL already exists",
            existingBlockId: existing.id,
          },
          { status: 409 }
        );
      }

      // Fetch link preview
      try {
        const { fetchLinkPreview } = await import("@/lib/preview");
        const preview = await fetchLinkPreview(input);
        title = preview.title;
        description = preview.description;
        imageUrl = preview.imageUrl;
        faviconUrl = preview.faviconUrl;
        siteName = preview.siteName;
        contentType = preview.contentType;
        if (preview.domain) {
          domain = preview.domain;
        }
      } catch {
        // Preview fetch failed — continue with partial data
      }

      // Extract keywords from metadata
      const textsForKeywords = [title, description, siteName, domain].filter(
        Boolean
      ) as string[];
      extractedKeywords = extractKeywords(textsForKeywords);
    } else {
      // TEXT block
      content = input;
      title = input.length > 100 ? input.substring(0, 100) + "..." : input;

      // Extract keywords from content
      extractedKeywords = extractKeywords([input]);
    }

    // Create block record
    await db.insert(blocks).values({
      id: blockId,
      type: detectedType,
      title,
      content,
      url,
      normalizedUrl: normalizedUrlValue,
      description,
      imageUrl,
      faviconUrl,
      siteName,
      domain,
      contentType,
      note: note || null,
      extractedKeywords: JSON.stringify(extractedKeywords),
      createdById: session.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Process channelIds
    if (channelIds && channelIds.length > 0) {
      for (const channelId of channelIds) {
        // Get max position for this channel
        const [maxPos] = await db
          .select({ maxPosition: max(channelBlocks.position) })
          .from(channelBlocks)
          .where(eq(channelBlocks.channelId, channelId));

        const position = (maxPos?.maxPosition ?? -1) + 1;

        await db.insert(channelBlocks).values({
          id: generateId(),
          channelId,
          blockId,
          position,
          createdAt: timestamp,
        });
      }
    }

    // Process tagNames
    const createdTags: { id: string; name: string; slug: string }[] = [];
    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const tagSlug = slugify(tagName);

        // Find or create tag
        let [existingTag] = await db
          .select()
          .from(tags)
          .where(eq(tags.slug, tagSlug))
          .limit(1);

        if (!existingTag) {
          const tagId = generateId();
          await db.insert(tags).values({
            id: tagId,
            name: tagName.trim(),
            slug: tagSlug,
            createdAt: timestamp,
          });
          existingTag = { id: tagId, name: tagName.trim(), slug: tagSlug, createdAt: timestamp };
        }

        // Create block_tags record
        await db.insert(blockTags).values({
          id: generateId(),
          blockId,
          tagId: existingTag.id,
        });

        createdTags.push({
          id: existingTag.id,
          name: existingTag.name,
          slug: existingTag.slug,
        });
      }
    }

    // Fetch the created block with its relations
    const [createdBlock] = await db
      .select()
      .from(blocks)
      .where(eq(blocks.id, blockId))
      .limit(1);

    // Get associated channels
    const blockChannels = channelIds && channelIds.length > 0
      ? await db
          .select()
          .from(channelBlocks)
          .where(eq(channelBlocks.blockId, blockId))
      : [];

    return Response.json(
      {
        ...createdBlock,
        extractedKeywords,
        tags: createdTags,
        channels: blockChannels,
        isFavorite: Boolean(createdBlock.isFavorite),
        isArchived: Boolean(createdBlock.isArchived),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Block creation error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const type = searchParams.get("type");
    const isFavorite = searchParams.get("isFavorite");
    const isArchived = searchParams.get("isArchived");

    // Build conditions
    const conditions = [];

    if (type) {
      conditions.push(eq(blocks.type, type));
    }
    if (isFavorite !== null && isFavorite !== undefined && isFavorite !== "") {
      conditions.push(eq(blocks.isFavorite, parseInt(isFavorite, 10)));
    }
    if (isArchived !== null && isArchived !== undefined && isArchived !== "") {
      conditions.push(eq(blocks.isArchived, parseInt(isArchived, 10)));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(blocks)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Get paginated blocks
    const blockList = await db
      .select()
      .from(blocks)
      .where(whereClause)
      .orderBy(desc(blocks.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse extractedKeywords and normalize boolean fields
    const formattedBlocks = blockList.map((block) => ({
      ...block,
      extractedKeywords: block.extractedKeywords
        ? JSON.parse(block.extractedKeywords)
        : [],
      isFavorite: Boolean(block.isFavorite),
      isArchived: Boolean(block.isArchived),
    }));

    return Response.json({ blocks: formattedBlocks, total });
  } catch (error) {
    console.error("Block list error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
