import { db } from "@/db";
import { channels, channelBlocks } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { now } from "@/lib/utils";
import { slugify } from "@/lib/slugify";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, id))
      .limit(1);

    if (!existing) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, collectionId } = body;

    const updates: Record<string, unknown> = {
      updatedAt: now(),
    };

    if (name !== undefined) {
      updates.name = name.trim();
      updates.slug = slugify(name);
    }
    if (description !== undefined) {
      updates.description = description;
    }
    if (collectionId !== undefined) {
      updates.collectionId = collectionId;
    }

    await db.update(channels).set(updates).where(eq(channels.id, id));

    const [updated] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, id))
      .limit(1);

    return Response.json(updated);
  } catch (error) {
    console.error("Channel update error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, id))
      .limit(1);

    if (!existing) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Delete channel_blocks records first
    await db.delete(channelBlocks).where(eq(channelBlocks.channelId, id));

    // Delete the channel
    await db.delete(channels).where(eq(channels.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Channel deletion error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
