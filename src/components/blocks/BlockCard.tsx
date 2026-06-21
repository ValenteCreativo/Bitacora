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
      className="block border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
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
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
          {displayTitle}
        </h3>

        {/* Description preview (for LINK blocks or blocks with description) */}
        {isLink && descriptionPreview && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {descriptionPreview}
          </p>
        )}

        {/* Content preview for TEXT blocks */}
        {!isLink && block.content && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
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
            <span className="text-xs text-gray-500">{block.domain}</span>
          </div>
        )}

        {/* Tags */}
        {block.tags && block.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {block.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Relative date */}
        <p className="mt-2 text-xs text-gray-400">
          {formatRelativeTime(block.createdAt)}
        </p>
      </div>
    </Link>
  );
}
