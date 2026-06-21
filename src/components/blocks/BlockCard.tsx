import Link from "next/link";
import { formatRelativeTime } from "@/lib/relative-time";

interface BlockTag {
  id: string;
  name: string;
  slug: string;
}

interface Block {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  url: string | null;
  description: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
  domain: string | null;
  extractedKeywords: string[];
  tags?: BlockTag[];
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: number;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export function BlockCard({ block }: { block: Block }) {
  const isLink = block.type === "LINK";
  const displayTitle = block.title || (isLink ? block.domain : "Untitled");
  const descriptionPreview = block.description
    ? truncate(block.description, 100)
    : "";

  return (
    <Link
      href={`/app/b/${block.id}`}
      className="block border border-[#e8dfd2] rounded-lg bg-[#faf7f2] hover:shadow-md hover:border-[#d4c9b8] transition-all"
    >
      {/* Image thumbnail for blocks with imageUrl */}
      {block.imageUrl && (
        <div
          className="aspect-video w-full rounded-t-lg bg-cover bg-center"
          style={{ backgroundImage: `url(${block.imageUrl})` }}
          aria-hidden="true"
        />
      )}

      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-medium text-[#2c2416] line-clamp-2">
          {displayTitle}
        </h3>

        {/* Description preview (for LINK blocks or blocks with description) */}
        {isLink && descriptionPreview && (
          <p className="mt-1 text-xs text-[#8b775b] line-clamp-2">
            {descriptionPreview}
          </p>
        )}

        {/* Content preview for TEXT blocks */}
        {!isLink && block.content && (
          <p className="mt-1 text-xs text-[#8b775b] line-clamp-2">
            {truncate(block.content, 100)}
          </p>
        )}

        {/* Domain + favicon for LINK blocks */}
        {isLink && block.domain && (
          <div className="mt-2 flex items-center gap-1">
            {block.faviconUrl && (
              <img
                src={block.faviconUrl}
                alt=""
                width={12}
                height={12}
                className="w-3 h-3 rounded-sm"
              />
            )}
            <span className="text-xs text-[#b8a88e]">{block.domain}</span>
          </div>
        )}

        {/* Tags */}
        {block.tags && block.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {block.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs bg-[#f5f0e8] text-[#8b775b] rounded-full px-2 py-0.5 border border-[#e8dfd2]"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Relative date */}
        <p className="mt-2 text-xs text-[#b8a88e]">
          {formatRelativeTime(block.createdAt)}
        </p>
      </div>
    </Link>
  );
}
