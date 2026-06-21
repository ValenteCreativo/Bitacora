import { db } from "@/db";
import { tags, blockTags, blocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlockGrid } from "@/components/blocks/BlockGrid";

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the tag
  const [tag] = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);

  if (!tag) {
    notFound();
  }

  // Fetch blocks with this tag
  const taggedBlockRows = await db
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
    .from(blockTags)
    .innerJoin(blocks, eq(blockTags.blockId, blocks.id))
    .where(eq(blockTags.tagId, tag.id))
    .orderBy(blocks.createdAt);

  // Fetch all tags for each block
  const blockIds = taggedBlockRows.map((b) => b.id);
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

    for (const t of allTags) {
      if (blockIds.includes(t.blockId)) {
        if (!tagsByBlock[t.blockId]) {
          tagsByBlock[t.blockId] = [];
        }
        tagsByBlock[t.blockId].push({ id: t.id, name: t.name, slug: t.slug });
      }
    }
  }

  const blocksForGrid = taggedBlockRows.map((block) => ({
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
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        ← Back
      </Link>

      {/* Tag header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          #{tag.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {blocksForGrid.length}{" "}
          {blocksForGrid.length === 1 ? "block" : "blocks"} tagged
        </p>
      </div>

      {/* Block grid */}
      <BlockGrid
        blocks={blocksForGrid}
        emptyTitle="No blocks with this tag"
        emptyMessage="Blocks tagged with this tag will appear here."
      />
    </div>
  );
}
