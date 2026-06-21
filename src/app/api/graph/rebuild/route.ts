import { getSessionFromRequest } from "@/lib/auth";
import { rebuildAllGraphEdges } from "@/lib/graph";

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await rebuildAllGraphEdges();

    return Response.json({ success: true, message: "Graph rebuilt" });
  } catch (error) {
    console.error("Graph rebuild error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
