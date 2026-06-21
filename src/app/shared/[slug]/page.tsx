import { db } from "@/db";
import { collections, channels, channelBlocks, blocks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SharedCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the collection only if public
  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.visibility, "PUBLIC")))
    .limit(1);

  if (!collection) {
    notFound();
  }

  // Fetch channels for this collection
  const collectionChannels = await db
    .select({
      id: channels.id,
      name: channels.name,
      slug: channels.slug,
      description: channels.description,
    })
    .from(channels)
    .where(eq(channels.collectionId, collection.id))
    .orderBy(channels.name);

  // Fetch blocks for each channel
  const channelIds = collectionChannels.map((c) => c.id);
  let blocksByChannel: Record<
    string,
    { id: string; type: string; title: string | null; url: string | null; domain: string | null; content: string | null; description: string | null; imageUrl: string | null }[]
  > = {};

  if (channelIds.length > 0) {
    for (const ch of collectionChannels) {
      const chBlocks = await db
        .select({
          id: blocks.id,
          type: blocks.type,
          title: blocks.title,
          url: blocks.url,
          domain: blocks.domain,
          content: blocks.content,
          description: blocks.description,
          imageUrl: blocks.imageUrl,
        })
        .from(channelBlocks)
        .innerJoin(blocks, eq(channelBlocks.blockId, blocks.id))
        .where(eq(channelBlocks.channelId, ch.id))
        .orderBy(channelBlocks.position);

      blocksByChannel[ch.id] = chBlocks;
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 119, 91, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 119, 91, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            {collection.color && (
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: collection.color }}
              />
            )}
            <h1 className="text-3xl font-serif font-bold text-[#2c2416]">
              {collection.name}
            </h1>
          </div>
          {collection.description && (
            <p className="text-lg text-[#8b775b] max-w-2xl mx-auto">
              {collection.description}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#8b775b]/60">
            <span>🌐 Public Collection</span>
            <span>•</span>
            <span>{collectionChannels.length} {collectionChannels.length === 1 ? "channel" : "channels"}</span>
          </div>
        </div>

        {/* Channels */}
        {collectionChannels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#8b775b]">This collection is empty.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {collectionChannels.map((channel) => (
              <section key={channel.id}>
                <div className="mb-4">
                  <h2 className="text-xl font-serif font-semibold text-[#2c2416]">
                    {channel.name}
                  </h2>
                  {channel.description && (
                    <p className="text-sm text-[#8b775b] mt-1">
                      {channel.description}
                    </p>
                  )}
                </div>

                {(!blocksByChannel[channel.id] || blocksByChannel[channel.id].length === 0) ? (
                  <p className="text-sm text-[#8b775b]/60 italic">No blocks in this channel.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {blocksByChannel[channel.id].map((block) => (
                      <div
                        key={block.id}
                        className="bg-white rounded-xl border border-[#e8dfd2] p-4 shadow-sm"
                      >
                        {block.imageUrl && (
                          <img
                            src={block.imageUrl}
                            alt=""
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        {block.title && (
                          <h3 className="text-sm font-semibold text-[#2c2416] mb-1 line-clamp-2">
                            {block.url ? (
                              <a
                                href={block.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {block.title}
                              </a>
                            ) : (
                              block.title
                            )}
                          </h3>
                        )}
                        {block.description && (
                          <p className="text-xs text-[#8b775b] line-clamp-3 mb-2">
                            {block.description}
                          </p>
                        )}
                        {block.content && !block.title && (
                          <p className="text-sm text-[#2c2416] line-clamp-4">
                            {block.content}
                          </p>
                        )}
                        {block.domain && (
                          <p className="text-xs text-[#8b775b]/60 mt-2">
                            {block.domain}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[#e8dfd2] text-center">
          <p className="text-sm text-[#8b775b]/60">
            Shared via Bitácora
          </p>
        </footer>
      </main>
    </div>
  );
}
