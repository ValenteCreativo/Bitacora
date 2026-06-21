import { db } from "@/db";
import { collections, channels, channelBlocks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the collection
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);

  if (!collection) {
    notFound();
  }

  // Fetch channels with block counts
  const collectionChannels = await db
    .select({
      id: channels.id,
      name: channels.name,
      slug: channels.slug,
      description: channels.description,
      blockCount: sql<number>`count(${channelBlocks.id})`.as("block_count"),
    })
    .from(channels)
    .leftJoin(channelBlocks, eq(channelBlocks.channelId, channels.id))
    .where(eq(channels.collectionId, collection.id))
    .groupBy(channels.id)
    .orderBy(channels.name);

  return (
    <div>
      {/* Back navigation */}
      <Link
        href="/app/collections"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        ← Collections
      </Link>

      {/* Collection header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {collection.color && (
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: collection.color }}
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {collection.name}
          </h1>
        </div>
        {collection.description && (
          <p className="text-base text-gray-600">{collection.description}</p>
        )}
      </div>

      {/* Channels list */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Channels
      </h2>

      {collectionChannels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <h3 className="text-sm font-medium text-gray-900">No channels yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            This collection doesn&apos;t have any channels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collectionChannels.map((channel) => (
            <Link
              key={channel.id}
              href={`/app/c/${channel.slug}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {channel.name}
              </h3>
              {channel.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {channel.description}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {channel.blockCount}{" "}
                {channel.blockCount === 1 ? "block" : "blocks"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
