import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);

    if (!session) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
