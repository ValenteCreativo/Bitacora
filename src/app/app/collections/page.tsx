import { db } from "@/db";
import { collections, channels } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import CollectionsListClient from "@/components/taxonomy/CollectionsListClient";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collectionsWithCounts = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      description: collections.description,
      color: collections.color,
      visibility: collections.visibility,
      channelCount: sql<number>`count(${channels.id})`.as("channel_count"),
    })
    .from(collections)
    .leftJoin(channels, eq(channels.collectionId, collections.id))
    .groupBy(collections.id)
    .orderBy(collections.name);

  return <CollectionsListClient collections={collectionsWithCounts} />;
}
