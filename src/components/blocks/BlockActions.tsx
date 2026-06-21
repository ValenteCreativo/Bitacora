"use client";

import { useState } from "react";

interface BlockActionsProps {
  blockId: string;
  isFavorite: boolean;
  isArchived: boolean;
}

export default function BlockActions({
  blockId,
  isFavorite: initialFavorite,
  isArchived: initialArchived,
}: BlockActionsProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isArchived, setIsArchived] = useState(initialArchived);
  const [loading, setLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function toggleFavorite() {
    setLoading("favorite");
    try {
      const res = await fetch(`/api/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });
      if (res.ok) {
        setIsFavorite(!isFavorite);
      }
    } finally {
      setLoading(null);
    }
  }

  async function toggleArchive() {
    setLoading("archive");
    try {
      const res = await fetch(`/api/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !isArchived }),
      });
      if (res.ok) {
        setIsArchived(!isArchived);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    setLoading("delete");
    try {
      const res = await fetch(`/api/blocks/${blockId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.href = "/app";
      }
    } finally {
      setLoading(null);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={toggleFavorite}
        disabled={loading === "favorite"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isFavorite
            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } disabled:opacity-50`}
      >
        <span>{isFavorite ? "★" : "☆"}</span>
        {isFavorite ? "Favorited" : "Favorite"}
      </button>

      <button
        onClick={toggleArchive}
        disabled={loading === "archive"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isArchived
            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } disabled:opacity-50`}
      >
        <span>{isArchived ? "📦" : "📥"}</span>
        {isArchived ? "Archived" : "Archive"}
      </button>

      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <span>🗑</span>
          Delete
        </button>
      ) : (
        <div className="inline-flex items-center gap-2">
          <span className="text-sm text-red-600">Are you sure?</span>
          <button
            onClick={handleDelete}
            disabled={loading === "delete"}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
