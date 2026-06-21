import { db } from "@/db";
import { tags, blockTags } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { generateId, now } from "@/lib/utils";
import { eq, sql, desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    const normalizedName = name.toLowerCase().trim();
    const tagSlug = slugify(normalizedName);

    if (!tagSlug) {
      return Response.json(
        { error: "Invalid tag name — cannot generate slug" },
        { status: 400 }
      );
    }

    // Check if tag with this slug already exists
    const [existing] = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, tagSlug))
      .limit(1);

    if (existing) {
      return Response.json(existing, { status: 200 });
    }

    // Create new tag
    const tagId = generateId();
    const timestamp = now();

    await db.insert(tags).values({
      id: tagId,
      name: normalizedName,
      slug: tagSlug,
      createdAt: timestamp,
    });

    const [createdTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    return Response.json(createdTag, { status: 201 });
  } catch (error) {
    console.error("Tag creation error:", error);
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

    // List all tags with block count via LEFT JOIN
    const tagsWithCounts = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
        blockCount: sql<number>`count(${blockTags.blockId})`,
      })
      .from(tags)
      .leftJoin(blockTags, eq(tags.id, blockTags.tagId))
      .groupBy(tags.id, tags.name, tags.slug, tags.createdAt)
      .orderBy(desc(sql<number>`count(${blockTags.blockId})`));

    return Response.json({ tags: tagsWithCounts });
  } catch (error) {
    console.error("Tag list error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
