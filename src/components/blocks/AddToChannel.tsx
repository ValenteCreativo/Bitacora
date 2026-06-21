"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Channel {
  id: string;
  name: string;
  slug: string;
}

interface AddToChannelProps {
  blockId: string;
  currentChannels: Channel[];
}

export default function AddToChannel({ blockId, currentChannels }: AddToChannelProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch all channels when dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => {
        setAllChannels(data.channels || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const currentIds = new Set(currentChannels.map((c) => c.id));
  const availableChannels = allChannels.filter((c) => !currentIds.has(c.id));

  const addToChannel = useCallback(
    async (channelId: string) => {
      setActionLoading(channelId);
      try {
        const res = await fetch(`/api/channels/${channelId}/blocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId }),
        });
        if (res.ok) {
          router.refresh();
          setIsOpen(false);
        }
      } finally {
        setActionLoading(null);
      }
    },
    [blockId, router]
  );

  const removeFromChannel = useCallback(
    async (channelId: string) => {
      setActionLoading(channelId);
      try {
        const res = await fetch(`/api/channels/${channelId}/blocks`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId }),
        });
        if (res.ok) {
          router.refresh();
        }
      } finally {
        setActionLoading(null);
      }
    },
    [blockId, router]
  );

  return (
    <div>
      {/* Current channels with remove button */}
      {currentChannels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {currentChannels.map((channel) => (
            <span
              key={channel.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#e8dfd2]/50 text-[#5c4a32] rounded-md border border-[#e8dfd2]"
            >
              {channel.name}
              <button
                onClick={() => removeFromChannel(channel.id)}
                disabled={actionLoading === channel.id}
                className="text-[#8b775b] hover:text-red-600 transition-colors disabled:opacity-50"
                aria-label={`Remove from ${channel.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add button */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#5c4a32] border border-[#e8dfd2] rounded-md hover:bg-[#e8dfd2] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14m-7-7h14" />
          </svg>
          Add to channel
        </button>
      ) : (
        <div className="border border-[#e8dfd2] rounded-lg bg-[#faf7f2] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#8b775b] uppercase tracking-wider">
              Select a channel
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-[#8b775b] hover:text-[#2c2416]"
            >
              Cancel
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#8b775b] py-2">Loading channels…</p>
          ) : availableChannels.length === 0 ? (
            <p className="text-sm text-[#8b775b] py-2">
              {allChannels.length === 0
                ? "No channels exist yet."
                : "This block is already in all channels."}
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {availableChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => addToChannel(channel.id)}
                  disabled={actionLoading === channel.id}
                  className="w-full text-left px-3 py-2 text-sm text-[#2c2416] rounded-md hover:bg-[#e8dfd2] transition-colors disabled:opacity-50 flex items-center justify-between"
                >
                  <span>{channel.name}</span>
                  {actionLoading === channel.id ? (
                    <span className="text-xs text-[#8b775b]">Adding…</span>
                  ) : (
                    <span className="text-xs text-[#8b775b]">+</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
