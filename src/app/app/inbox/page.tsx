import { db } from "@/db";
import { blocks, channelBlocks, blockTags, tags } from "@/db/schema";
import { sql, eq, isNull } from "drizzle-orm";
import { BlockGrid } from "@/components/blocks/BlockGrid";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  // Fetch all blocks that are NOT associated with any channel
  const inboxBlocks = await db
    .select({
      id: blocks.id,
      type: blocks.type,
      title: blocks.title,
      content: blocks.content,
      url: blocks.url,
      description: blocks.description,
      imageUrl: blocks.imageUrl,
      faviconUrl: blocks.faviconUrl,
      domain: blocks.domain,
      extractedKeywords: blocks.extractedKeywords,
      isFavorite: blocks.isFavorite,
      isArchived: blocks.isArchived,
      createdAt: blocks.createdAt,
    })
    .from(blocks)
    .leftJoin(channelBlocks, eq(channelBlocks.blockId, blocks.id))
    .where(isNull(channelBlocks.id))
    .orderBy(sql`${blocks.createdAt} DESC`);

  // Fetch tags for each block
  const blockIds = inboxBlocks.map((b) => b.id);
  let tagsByBlock: Record<string, { id: string; name: string; slug: string }[]> = {};

  if (blockIds.length > 0) {
    const allTags = await db
      .select({
        blockId: blockTags.blockId,
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(blockTags)
      .innerJoin(tags, eq(blockTags.tagId, tags.id));

    for (const tag of allTags) {
      if (blockIds.includes(tag.blockId)) {
        if (!tagsByBlock[tag.blockId]) {
          tagsByBlock[tag.blockId] = [];
        }
        tagsByBlock[tag.blockId].push({ id: tag.id, name: tag.name, slug: tag.slug });
      }
    }
  }

  const blocksForGrid = inboxBlocks.map((block) => ({
    id: block.id,
    type: block.type,
    title: block.title,
    content: block.content,
    url: block.url,
    description: block.description,
    imageUrl: block.imageUrl,
    faviconUrl: block.faviconUrl,
    domain: block.domain,
    extractedKeywords: block.extractedKeywords
      ? JSON.parse(block.extractedKeywords)
      : [],
    tags: tagsByBlock[block.id] || [],
    isFavorite: Boolean(block.isFavorite),
    isArchived: Boolean(block.isArchived),
    createdAt: block.createdAt,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-sm text-gray-500 mt-1">
          Blocks not assigned to any channel.
        </p>
      </div>

      <BlockGrid
        blocks={blocksForGrid}
        emptyTitle="Inbox is empty"
        emptyMessage="All your blocks are organized in channels. Nice work!"
      />
    </div>
  );
}
