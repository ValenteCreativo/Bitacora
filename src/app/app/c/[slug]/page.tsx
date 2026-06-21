import { db } from "@/db";
import { channels, channelBlocks, blocks, blockTags, tags, collections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlockGrid } from "@/components/blocks/BlockGrid";
import ChannelDetailClient from "@/components/taxonomy/ChannelDetailClient";

export const dynamic = "force-dynamic";

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the channel
  const [channel] = await db
    .select({
      id: channels.id,
      name: channels.name,
      slug: channels.slug,
      description: channels.description,
      collectionId: channels.collectionId,
      createdAt: channels.createdAt,
    })
    .from(channels)
    .where(eq(channels.slug, slug))
    .limit(1);

  if (!channel) {
    notFound();
  }

  // Fetch parent collection if exists
  let collectionInfo: { name: string; slug: string } | null = null;
  if (channel.collectionId) {
    const [col] = await db
      .select({ name: collections.name, slug: collections.slug })
      .from(collections)
      .where(eq(collections.id, channel.collectionId))
      .limit(1);
    if (col) {
      collectionInfo = col;
    }
  }

  // Fetch all collections for the edit form dropdown
  const allCollections = await db
    .select({ id: collections.id, name: collections.name })
    .from(collections)
    .orderBy(collections.name);

  // Fetch blocks in this channel
  const channelBlockRows = await db
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
    .from(channelBlocks)
    .innerJoin(blocks, eq(channelBlocks.blockId, blocks.id))
    .where(eq(channelBlocks.channelId, channel.id))
    .orderBy(channelBlocks.position);

  // Fetch tags for each block
  const blockIds = channelBlockRows.map((b) => b.id);
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

  const blocksForGrid = channelBlockRows.map((block) => ({
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
      {/* Back navigation */}
      <Link
        href="/app/channels"
        className="inline-flex items-center gap-1 text-sm text-[#8b775b] hover:text-[#2c2416] transition-colors mb-6"
      >
        ← Channels
      </Link>

      {/* Channel header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#2c2416] mb-1">
              {channel.name}
            </h1>
            {channel.description && (
              <p className="text-base text-[#8b775b] mb-2">{channel.description}</p>
            )}
            {collectionInfo && (
              <Link
                href={`/app/collections/${collectionInfo.slug}`}
                className="inline-block text-sm text-[#8b775b] hover:text-[#2c2416] transition-colors"
              >
                In {collectionInfo.name}
              </Link>
            )}
          </div>
          <ChannelDetailClient channel={channel} collections={allCollections} />
        </div>
      </div>

      {/* Block grid */}
      <BlockGrid
        blocks={blocksForGrid}
        emptyTitle="No blocks in this channel"
        emptyMessage="Add blocks to this channel to see them here."
      />
    </div>
  );
}
