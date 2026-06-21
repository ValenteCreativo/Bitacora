import { db } from "@/db";
import { collections, channels } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { generateId, now } from "@/lib/utils";
import { slugify, generateUniqueSlug } from "@/lib/slugify";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name || name.trim().length === 0) {
      return Response.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    let slug = slugify(name);

    // Check for duplicate slug
    const existingSlugs = await db
      .select({ slug: collections.slug })
      .from(collections);

    const slugList = existingSlugs.map((r) => r.slug);
    if (slugList.includes(slug)) {
      slug = generateUniqueSlug(name, slugList);
    }

    const id = generateId();
    const timestamp = now();

    await db.insert(collections).values({
      id,
      name: name.trim(),
      slug,
      description: description || null,
      color: color || null,
      icon: icon || null,
      createdById: session.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const [created] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("Collection creation error:", error);
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

    // Get all collections with channel count using a subquery
    const collectionsWithCounts = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        color: collections.color,
        icon: collections.icon,
        visibility: collections.visibility,
        createdById: collections.createdById,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        channelCount: sql<number>`(
          SELECT COUNT(*) FROM channels
          WHERE channels.collection_id = ${collections.id}
        )`.as("channel_count"),
      })
      .from(collections);

    return Response.json({ collections: collectionsWithCounts });
  } catch (error) {
    console.error("Collection list error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
