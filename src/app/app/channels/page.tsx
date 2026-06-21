import { db } from "@/db";
import { channels, channelBlocks, collections } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ChannelsPage() {
  const channelsWithCounts = await db
    .select({
      id: channels.id,
      name: channels.name,
      slug: channels.slug,
      description: channels.description,
      collectionName: collections.name,
      blockCount: sql<number>`count(${channelBlocks.id})`.as("block_count"),
    })
    .from(channels)
    .leftJoin(channelBlocks, eq(channelBlocks.channelId, channels.id))
    .leftJoin(collections, eq(channels.collectionId, collections.id))
    .groupBy(channels.id)
    .orderBy(channels.name);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Channels</h1>

      {channelsWithCounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No channels yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a channel to start organizing blocks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channelsWithCounts.map((channel) => (
            <Link
              key={channel.id}
              href={`/app/c/${channel.slug}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all"
            >
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                {channel.name}
              </h2>
              {channel.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>
                  {channel.blockCount}{" "}
                  {channel.blockCount === 1 ? "block" : "blocks"}
                </span>
                {channel.collectionName && (
                  <>
                    <span>•</span>
                    <span>{channel.collectionName}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
