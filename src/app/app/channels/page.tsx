import { db } from "@/db";
import { channels, channelBlocks, collections } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import ChannelsListClient from "@/components/taxonomy/ChannelsListClient";

export const dynamic = "force-dynamic";

export default async function ChannelsPage() {
  const channelsWithCounts = await db
    .select({
      id: channels.id,
      name: channels.name,
      slug: channels.slug,
      description: channels.description,
      collectionId: channels.collectionId,
      collectionName: collections.name,
      blockCount: sql<number>`count(${channelBlocks.id})`.as("block_count"),
    })
    .from(channels)
    .leftJoin(channelBlocks, eq(channelBlocks.channelId, channels.id))
    .leftJoin(collections, eq(channels.collectionId, collections.id))
    .groupBy(channels.id)
    .orderBy(channels.name);

  // Fetch all collections for the form dropdown
  const allCollections = await db
    .select({ id: collections.id, name: collections.name })
    .from(collections)
    .orderBy(collections.name);

  return (
    <ChannelsListClient
      channels={channelsWithCounts}
      collections={allCollections}
    />
  );
}
