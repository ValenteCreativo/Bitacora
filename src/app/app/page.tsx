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
      <div className="mb-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Quick Capture
            </h2>
            <p className="text-sm text-gray-500">
              Paste a link or write a note. Use the{" "}
              <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded">+</kbd>{" "}
              button or press it from anywhere.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link
          href="/app/inbox"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:border-gray-200 hover:shadow-md transition-all"
        >
          <p className="text-2xl font-bold text-gray-900">{totalBlocks}</p>
          <p className="text-xs text-gray-500 mt-1">Blocks</p>
        </Link>
        <Link
          href="/app/collections"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:border-gray-200 hover:shadow-md transition-all"
        >
          <p className="text-2xl font-bold text-gray-900">{totalCollections}</p>
          <p className="text-xs text-gray-500 mt-1">Collections</p>
        </Link>
        <Link
          href="/app/channels"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:border-gray-200 hover:shadow-md transition-all"
        >
          <p className="text-2xl font-bold text-gray-900">{totalChannels}</p>
          <p className="text-xs text-gray-500 mt-1">Channels</p>
        </Link>
      </div>

      {/* Recent blocks */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
