import { db } from "@/db";
import { collections, channels } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collectionsWithCounts = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      description: collections.description,
      color: collections.color,
      icon: collections.icon,
      channelCount: sql<number>`count(${channels.id})`.as("channel_count"),
    })
    .from(collections)
    .leftJoin(channels, eq(channels.collectionId, collections.id))
    .groupBy(collections.id)
    .orderBy(collections.name);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Collections</h1>

      {collectionsWithCounts.length === 0 ? (
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
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No collections yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a collection to organize your channels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collectionsWithCounts.map((collection) => (
            <Link
              key={collection.id}
              href={`/app/collections/${collection.slug}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                {collection.color && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: collection.color }}
                  />
                )}
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {collection.name}
                </h2>
              </div>
              {collection.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {collection.description}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {collection.channelCount}{" "}
                {collection.channelCount === 1 ? "channel" : "channels"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
