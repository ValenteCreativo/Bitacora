import { db } from "@/db";
import { blocks, collections, channels, blockTags, tags } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { BlockGrid } from "@/components/blocks/BlockGrid";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch quick stats
  const [blockCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blocks);

  const [collectionCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(collections);

  const [channelCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(channels);

  const totalBlocks = blockCountResult?.count ?? 0;
  const totalCollections = collectionCountResult?.count ?? 0;
  const totalChannels = channelCountResult?.count ?? 0;

  // Fetch recent blocks (last 10)
  const recentBlocks = await db
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
    .orderBy(desc(blocks.createdAt))
    .limit(10);

  // Fetch tags for recent blocks
  const blockIds = recentBlocks.map((b) => b.id);
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

  const blocksForGrid = recentBlocks.map((block) => ({
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
      {/* Quick Capture callout */}
      <div className="mb-8 rounded-lg border border-[#e8dfd2] bg-[#faf7f2] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#2c2416]/5 flex items-center justify-center shrink-0">
            <span className="text-lg">⚓</span>
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-[#2c2416] mb-1">
              Quick Capture
            </h2>
            <p className="text-sm text-[#8b775b]">
              Paste a link or write a note. Use the{" "}
              <kbd className="px-1.5 py-0.5 text-xs bg-[#f5f0e8] border border-[#d4c9b8] rounded font-mono">+</kbd>{" "}
              button from anywhere.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link
          href="/app/inbox"
          className="rounded-lg border border-[#e8dfd2] bg-[#faf7f2] p-4 text-center hover:border-[#d4c9b8] hover:shadow-md transition-all"
        >
          <p className="font-serif text-2xl font-bold text-[#2c2416]">{totalBlocks}</p>
          <p className="text-xs text-[#8b775b] mt-1">Blocks</p>
        </Link>
        <Link
          href="/app/collections"
          className="rounded-lg border border-[#e8dfd2] bg-[#faf7f2] p-4 text-center hover:border-[#d4c9b8] hover:shadow-md transition-all"
        >
          <p className="font-serif text-2xl font-bold text-[#2c2416]">{totalCollections}</p>
          <p className="text-xs text-[#8b775b] mt-1">Collections</p>
        </Link>
        <Link
          href="/app/channels"
          className="rounded-lg border border-[#e8dfd2] bg-[#faf7f2] p-4 text-center hover:border-[#d4c9b8] hover:shadow-md transition-all"
        >
          <p className="font-serif text-2xl font-bold text-[#2c2416]">{totalChannels}</p>
          <p className="text-xs text-[#8b775b] mt-1">Channels</p>
        </Link>
      </div>

      {/* Recent blocks */}
      <div>
        <h2 className="font-serif text-lg font-semibold text-[#2c2416] mb-4">
          Recent Blocks
        </h2>
        <BlockGrid
          blocks={blocksForGrid}
          emptyTitle="No blocks yet"
          emptyMessage="Save a link or note to get started."
        />
      </div>
    </div>
  );
}
