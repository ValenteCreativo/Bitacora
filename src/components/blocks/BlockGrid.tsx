import { BlockCard } from "./BlockCard";
import { EmptyState } from "@/components/ui/EmptyState";

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

interface BlockGridProps {
  blocks: Block[];
  emptyTitle?: string;
  emptyMessage?: string;
}

export function BlockGrid({ blocks, emptyTitle, emptyMessage }: BlockGridProps) {
  if (blocks.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {blocks.map((block) => (
        <BlockCard key={block.id} block={block} />
      ))}
    </div>
  );
}
