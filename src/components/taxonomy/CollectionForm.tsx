"use client";

import { useState, useEffect, useCallback } from "react";

const NAUTICAL_COLORS = [
  "#1e3a5f", // deep navy
  "#2d5f8a", // ocean blue
  "#4a7c59", // sea moss
  "#8b4513", // driftwood
  "#c17817", // brass
  "#6b3a5b", // twilight plum
  "#2c4a3e", // kelp
  "#8b775b", // sand accent
];

type Visibility = "PRIVATE" | "PUBLIC" | "UNLISTED";

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  visibility: string | null;
}

interface CollectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collection?: CollectionData | null;
}

export default function CollectionForm({
  isOpen,
  onClose,
  onSuccess,
  collection,
}: CollectionFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(NAUTICAL_COLORS[0]);
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEdit = !!collection;

  useEffect(() => {
    if (isOpen && collection) {
      setName(collection.name);
      setDescription(collection.description || "");
      setColor(collection.color || NAUTICAL_COLORS[0]);
      setVisibility((collection.visibility as Visibility) || "PRIVATE");
    } else if (isOpen) {
      setName("");
      setDescription("");
      setColor(NAUTICAL_COLORS[0]);
      setVisibility("PRIVATE");
    }
    setError(null);
    setShowDeleteConfirm(false);
  }, [isOpen, collection]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const url = isEdit
        ? `/api/collections/${collection!.id}`
        : "/api/collections";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          color,
          visibility,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, [name, description, color, visibility, loading, isEdit, collection, onSuccess, onClose]);

  const handleDelete = useCallback(async () => {
    if (!collection || loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, [collection, loading, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-form-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#f5f0e8] rounded-xl shadow-2xl border border-[#e8dfd2] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dfd2]">
          <h2
            id="collection-form-title"
            className="text-lg font-serif font-semibold text-[#2c2416]"
          >
            {isEdit ? "Edit Collection" : "New Collection"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#8b775b] hover:text-[#2c2416] hover:bg-[#e8dfd2] transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="collection-name" className="block text-sm font-medium text-[#2c2416] mb-1">
              Name
            </label>
            <input
              id="collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Inspiration"
              className="w-full px-3 py-2 bg-white border border-[#e8dfd2] rounded-lg text-[#2c2416] placeholder:text-[#8b775b]/50 focus:outline-none focus:ring-2 focus:ring-[#8b775b] transition-shadow"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="collection-desc" className="block text-sm font-medium text-[#2c2416] mb-1">
              Description
            </label>
            <textarea
              id="collection-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection about?"
              rows={2}
              className="w-full px-3 py-2 bg-white border border-[#e8dfd2] rounded-lg text-[#2c2416] placeholder:text-[#8b775b]/50 focus:outline-none focus:ring-2 focus:ring-[#8b775b] resize-none transition-shadow"
              disabled={loading}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-[#2c2416] mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {NAUTICAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c
                      ? "border-[#2c2416] scale-110"
                      : "border-transparent hover:border-[#8b775b]/50"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div>
            <label className="block text-sm font-medium text-[#2c2416] mb-2">
              Visibility
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility("PRIVATE")}
                disabled={loading}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                  visibility === "PRIVATE"
                    ? "bg-[#2c2416] text-white border-[#2c2416]"
                    : "bg-white text-[#2c2416] border-[#e8dfd2] hover:border-[#8b775b]"
                }`}
              >
                🔒 Private
              </button>
              <button
                type="button"
                onClick={() => setVisibility("PUBLIC")}
                disabled={loading}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                  visibility === "PUBLIC"
                    ? "bg-[#2c2416] text-white border-[#2c2416]"
                    : "bg-white text-[#2c2416] border-[#e8dfd2] hover:border-[#8b775b]"
                }`}
              >
                🌐 Public
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e8dfd2] flex items-center justify-between">
          {isEdit ? (
            <div>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors"
                  disabled={loading}
                >
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">Are you sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    disabled={loading}
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-xs px-2 py-1 text-[#8b775b] hover:text-[#2c2416] transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#2c2416] border border-[#e8dfd2] rounded-lg hover:bg-[#e8dfd2] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2c2416] rounded-lg hover:bg-[#3d3020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
