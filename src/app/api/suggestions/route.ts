import { getSessionFromRequest } from "@/lib/auth";
import { suggestChannels, suggestTags } from "@/lib/suggestions";

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keywordsParam = searchParams.get("keywords") || "";

    if (!keywordsParam.trim()) {
      return Response.json({ channels: [], tags: [] });
    }

    const keywords = keywordsParam
      .split(",")
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0);

    const [channelSuggestions, tagSuggestions] = await Promise.all([
      suggestChannels(keywords),
      suggestTags(keywords),
    ]);

    return Response.json({
      channels: channelSuggestions,
      tags: tagSuggestions,
    });
  } catch (error) {
    console.error("Suggestions error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
