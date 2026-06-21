import { db } from "@/db";
import { channels, channelBlocks } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { generateId, now } from "@/lib/utils";
import { slugify } from "@/lib/slugify";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, collectionId } = body;

    if (!name || name.trim().length === 0) {
      return Response.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const id = generateId();
    const slug = slugify(name);
    const timestamp = now();

    await db.insert(channels).values({
      id,
      name: name.trim(),
      slug,
      description: description || null,
      collectionId: collectionId || null,
      createdById: session.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const [created] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, id))
      .limit(1);

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("Channel creation error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select({
        id: channels.id,
        name: channels.name,
        slug: channels.slug,
        description: channels.description,
        collectionId: channels.collectionId,
        visibility: channels.visibility,
        createdById: channels.createdById,
        createdAt: channels.createdAt,
        updatedAt: channels.updatedAt,
        blockCount: sql<number>`count(${channelBlocks.id})`,
      })
      .from(channels)
      .leftJoin(channelBlocks, eq(channels.id, channelBlocks.channelId))
      .groupBy(channels.id)
      .orderBy(channels.createdAt);

    return Response.json({ channels: result });
  } catch (error) {
    console.error("Channel list error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
