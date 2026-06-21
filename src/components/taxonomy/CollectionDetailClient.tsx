"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CollectionForm from "./CollectionForm";

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  visibility: string | null;
}

interface CollectionDetailClientProps {
  collection: CollectionData;
}

export default function CollectionDetailClient({ collection }: CollectionDetailClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  const handleDeleteSuccess = () => {
    router.push("/app/collections");
    router.refresh();
  };

  return (
    <>
      {/* Collection header with actions */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {collection.color && (
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: collection.color }}
                />
              )}
              <h1 className="text-2xl font-serif font-bold text-[#2c2416]">
                {collection.name}
              </h1>
              {collection.visibility === "PUBLIC" && (
                <span className="text-xs px-2 py-0.5 bg-[#e8dfd2] text-[#8b775b] rounded-full font-medium">
                  🌐 Public
                </span>
              )}
              {collection.visibility === "PRIVATE" && (
                <span className="text-xs px-2 py-0.5 bg-[#e8dfd2] text-[#8b775b] rounded-full font-medium">
                  🔒 Private
                </span>
              )}
            </div>
            {collection.description && (
              <p className="text-base text-[#8b775b]">{collection.description}</p>
            )}
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="px-3 py-1.5 text-sm font-medium text-[#2c2416] border border-[#e8dfd2] rounded-lg hover:bg-[#e8dfd2] transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <CollectionForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
        collection={collection}
      />
    </>
  );
}
