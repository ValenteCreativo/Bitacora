"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CollectionForm from "./CollectionForm";

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  visibility: string | null;
  channelCount: number;
}

interface CollectionsListClientProps {
  collections: CollectionItem[];
}

export default function CollectionsListClient({ collections }: CollectionsListClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);

  const handleSuccess = () => {
    router.refresh();
  };

  const openCreate = () => {
    setEditingCollection(null);
    setFormOpen(true);
  };

  const openEdit = (collection: CollectionItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCollection(collection);
    setFormOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#2c2416]">Collections</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-[#2c2416] rounded-lg hover:bg-[#3d3020] transition-colors"
        >
          + New Collection
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#e8dfd2] flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-[#8b775b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-[#2c2416]">No collections yet</h3>
          <p className="mt-1 text-sm text-[#8b775b]">
            Create a collection to organize your channels.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#2c2416] rounded-lg hover:bg-[#3d3020] transition-colors"
          >
            Create your first collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/app/collections/${collection.slug}`}
              className="group relative block bg-white rounded-xl border border-[#e8dfd2] shadow-sm p-5 hover:border-[#8b775b]/50 hover:shadow-md transition-all"
            >
              {/* Edit button */}
              <button
                onClick={(e) => openEdit(collection, e)}
                className="absolute top-3 right-3 p-1.5 rounded-md text-[#8b775b] opacity-0 group-hover:opacity-100 hover:text-[#2c2416] hover:bg-[#e8dfd2] transition-all"
                aria-label={`Edit ${collection.name}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-3">
                {collection.color && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: collection.color }}
                  />
                )}
                <h2 className="text-base font-semibold text-[#2c2416] truncate">
                  {collection.name}
                </h2>
              </div>
              {collection.description && (
                <p className="text-sm text-[#8b775b] line-clamp-2 mb-3">
                  {collection.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <p className="text-xs text-[#8b775b]/70">
                  {collection.channelCount}{" "}
                  {collection.channelCount === 1 ? "channel" : "channels"}
                </p>
                {collection.visibility === "PUBLIC" && (
                  <span className="text-xs px-1.5 py-0.5 bg-[#e8dfd2] text-[#8b775b] rounded">
                    🌐 Public
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CollectionForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
        collection={editingCollection}
      />
    </div>
  );
}
