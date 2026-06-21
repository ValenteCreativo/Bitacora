import { db } from "@/db";
import {
  blocks,
  blockTags,
  tags,
  channelBlocks,
  channels,
  graphEdges,
} from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import BlockActions from "@/components/blocks/BlockActions";
import AddToChannel from "@/components/blocks/AddToChannel";

export const dynamic = "force-dynamic";

export default async function BlockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch the block
  const [block] = await db
    .select()
    .from(blocks)
    .where(eq(blocks.id, id))
    .limit(1);

  if (!block) {
    notFound();
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
    })
    .from(channelBlocks)
    .innerJoin(channels, eq(channelBlocks.channelId, channels.id))
    .where(eq(channelBlocks.blockId, id));

  // Fetch related blocks via graph edges
  const edges = await db
    .select()
    .from(graphEdges)
    .where(or(eq(graphEdges.sourceId, id), eq(graphEdges.targetId, id)));

  const relatedBlockIds = new Set<string>();
  for (const edge of edges) {
    if (edge.sourceId === id && edge.targetType === "BLOCK") {
      relatedBlockIds.add(edge.targetId);
    } else if (edge.targetId === id && edge.sourceType === "BLOCK") {
      relatedBlockIds.add(edge.sourceId);
    }
  }

  let relatedBlocks: Array<{
    id: string;
    type: string;
    title: string | null;
    url: string | null;
    domain: string | null;
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

    relatedBlocks = relatedBlockRows
      .map((relBlock) => {
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
          domain: relBlock.domain,
          weight: edge?.weight ?? 0,
          reason: edge?.reason ?? null,
        };
      })
      .sort((a, b) => b.weight - a.weight);
  }

  const keywords: string[] = block.extractedKeywords
    ? JSON.parse(block.extractedKeywords)
    : [];

  const createdDate = new Date(block.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updatedDate = new Date(block.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-8 sm:px-8 sm:py-10">
        {/* Back navigation */}
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8"
        >
          ← Back
        </Link>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
          {block.title || "Untitled Block"}
        </h1>

        {/* Type badge + domain */}
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 uppercase">
            {block.type}
          </span>
          {block.domain && (
            <span className="text-sm text-gray-500">{block.domain}</span>
          )}
          {block.siteName && (
            <span className="text-sm text-gray-400">• {block.siteName}</span>
          )}
        </div>

        {/* URL for LINK blocks */}
        {block.type === "LINK" && block.url && (
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 mb-6 break-all"
          >
            {block.faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.faviconUrl}
                alt=""
                className="w-4 h-4 inline-block"
              />
            )}
            {block.url}
            <span className="text-xs">↗</span>
          </a>
        )}

        {/* Description */}
        {block.description && (
          <p className="text-base text-gray-700 leading-relaxed mb-6">
            {block.description}
          </p>
        )}

        {/* Image preview */}
        {block.imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.imageUrl}
              alt={block.title || "Block preview"}
              className="w-full h-auto max-h-80 object-cover"
            />
          </div>
        )}

        {/* Content (for TEXT blocks) */}
        {block.type === "TEXT" && block.content && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
              {block.content}
            </p>
          </div>
        )}

        {/* Note */}
        {block.note && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Note
            </h2>
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-lg p-4">
              {block.note}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mb-8 py-4 border-t border-b border-gray-100">
          <BlockActions
            blockId={block.id}
            isFavorite={Boolean(block.isFavorite)}
            isArchived={Boolean(block.isArchived)}
          />
        </div>

        {/* Tags */}
        {blockTagRows.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {blockTagRows.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/app/tags/${tag.slug}`}
                  className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Channels */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Channels
          </h2>
          <AddToChannel blockId={id} currentChannels={blockChannels} />
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Extracted Keywords
            </h2>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-block px-2.5 py-0.5 text-xs bg-purple-50 text-purple-700 rounded-md border border-purple-100"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Blocks */}
        {relatedBlocks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Related Blocks
            </h2>
            <div className="space-y-3">
              {relatedBlocks.map((related) => (
                <Link
                  key={related.id}
                  href={`/app/b/${related.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {related.title || "Untitled"}
                      </p>
                      {related.domain && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {related.domain}
                        </p>
                      )}
                      {related.reason && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {related.reason}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded bg-green-50 text-green-700">
                      {related.weight}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Metadata
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {block.contentType && (
              <>
                <dt className="text-gray-500">Content Type</dt>
                <dd className="text-gray-900">{block.contentType}</dd>
              </>
            )}
            {block.domain && (
              <>
                <dt className="text-gray-500">Domain</dt>
                <dd className="text-gray-900">{block.domain}</dd>
              </>
            )}
            {block.siteName && (
              <>
                <dt className="text-gray-500">Site Name</dt>
                <dd className="text-gray-900">{block.siteName}</dd>
              </>
            )}
            <>
              <dt className="text-gray-500">Created</dt>
              <dd className="text-gray-900">{createdDate}</dd>
            </>
            <>
              <dt className="text-gray-500">Updated</dt>
              <dd className="text-gray-900">{updatedDate}</dd>
            </>
          </dl>
        </div>
      </div>
    </div>
  );
}
