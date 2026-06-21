import { db } from "@/db";
import { channelBlocks } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { generateId, now } from "@/lib/utils";
import { eq, and, max } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: channelId } = await params;
    const body = await request.json();
    const { blockId, position } = body;

    if (!blockId) {
      return Response.json(
        { error: "blockId is required" },
        { status: 400 }
      );
    }

    // Determine position
    let finalPosition = position;
    if (finalPosition === undefined || finalPosition === null) {
      const [maxPos] = await db
        .select({ maxPosition: max(channelBlocks.position) })
        .from(channelBlocks)
        .where(eq(channelBlocks.channelId, channelId));

      finalPosition = (maxPos?.maxPosition ?? -1) + 1;
    }

    const recordId = generateId();
    const timestamp = now();

    try {
      await db.insert(channelBlocks).values({
        id: recordId,
        channelId,
        blockId,
        position: finalPosition,
        createdAt: timestamp,
      });
    } catch (insertError: unknown) {
      // Check for unique constraint violation
      const errorMessage =
        insertError instanceof Error ? insertError.message : "";
      if (
        errorMessage.includes("UNIQUE constraint failed") ||
        errorMessage.includes("unique_channel_block")
      ) {
        return Response.json(
          { error: "Block already exists in this channel" },
          { status: 409 }
        );
      }
      throw insertError;
    }

    const [created] = await db
      .select()
      .from(channelBlocks)
      .where(eq(channelBlocks.id, recordId))
      .limit(1);

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("Add block to channel error:", error);
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

    const { id: channelId } = await params;
    const body = await request.json();
    const { blockId } = body;

    if (!blockId) {
      return Response.json(
        { error: "blockId is required" },
        { status: 400 }
      );
    }

    await db
      .delete(channelBlocks)
      .where(
        and(
          eq(channelBlocks.channelId, channelId),
          eq(channelBlocks.blockId, blockId)
        )
      );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Remove block from channel error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
