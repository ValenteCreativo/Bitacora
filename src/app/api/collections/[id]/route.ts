import { db } from "@/db";
import { collections, channels } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { now } from "@/lib/utils";
import { slugify, generateUniqueSlug } from "@/lib/slugify";
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

    // Verify collection exists
    const [existing] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);

    if (!existing) {
      return Response.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, color, icon, visibility } = body;

    const updates: Record<string, unknown> = {
      updatedAt: now(),
    };

    // If name changes, regenerate slug
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return Response.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = name.trim();

      let slug = slugify(name);

      // Check for duplicate slug (exclude current collection)
      const existingSlugs = await db
        .select({ slug: collections.slug })
        .from(collections);

      const slugList = existingSlugs
        .filter((r) => r.slug !== existing.slug)
        .map((r) => r.slug);

      if (slugList.includes(slug)) {
        slug = generateUniqueSlug(name, slugList);
      }

      updates.slug = slug;
    }

    if (description !== undefined) {
      updates.description = description || null;
    }
    if (color !== undefined) {
      updates.color = color || null;
    }
    if (icon !== undefined) {
      updates.icon = icon || null;
    }
    if (visibility !== undefined) {
      const validVisibilities = ["PRIVATE", "PUBLIC", "UNLISTED"];
      if (validVisibilities.includes(visibility)) {
        updates.visibility = visibility;
      }
    }

    await db
      .update(collections)
      .set(updates)
      .where(eq(collections.id, id));

    const [updated] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);

    return Response.json(updated);
  } catch (error) {
    console.error("Collection update error:", error);
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

    // Verify collection exists
    const [existing] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);

    if (!existing) {
      return Response.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Disassociate channels by setting collectionId to null
    await db
      .update(channels)
      .set({ collectionId: null })
      .where(eq(channels.collectionId, id));

    // Delete the collection
    await db.delete(collections).where(eq(collections.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Collection delete error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
