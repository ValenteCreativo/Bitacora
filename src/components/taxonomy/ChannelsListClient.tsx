"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChannelForm from "./ChannelForm";

interface CollectionOption {
  id: string;
  name: string;
}

interface ChannelItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  collectionId: string | null;
  collectionName: string | null;
  blockCount: number;
}

interface ChannelsListClientProps {
  channels: ChannelItem[];
  collections: CollectionOption[];
}

export default function ChannelsListClient({ channels, collections }: ChannelsListClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelItem | null>(null);

  const handleSuccess = () => {
    router.refresh();
  };

  const openCreate = () => {
    setEditingChannel(null);
    setFormOpen(true);
  };

  const openEdit = (channel: ChannelItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChannel(channel);
    setFormOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#2c2416]">Channels</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-[#2c2416] rounded-lg hover:bg-[#3d3020] transition-colors"
        >
          + New Channel
        </button>
      </div>

      {channels.length === 0 ? (
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
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-[#2c2416]">No channels yet</h3>
          <p className="mt-1 text-sm text-[#8b775b]">
            Create a channel to start organizing blocks.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#2c2416] rounded-lg hover:bg-[#3d3020] transition-colors"
          >
            Create your first channel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <Link
              key={channel.id}
              href={`/app/c/${channel.slug}`}
              className="group relative block bg-white rounded-xl border border-[#e8dfd2] shadow-sm p-5 hover:border-[#8b775b]/50 hover:shadow-md transition-all"
            >
              {/* Edit button */}
              <button
                onClick={(e) => openEdit(channel, e)}
                className="absolute top-3 right-3 p-1.5 rounded-md text-[#8b775b] opacity-0 group-hover:opacity-100 hover:text-[#2c2416] hover:bg-[#e8dfd2] transition-all"
                aria-label={`Edit ${channel.name}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              <h2 className="text-base font-semibold text-[#2c2416] mb-1">
                {channel.name}
              </h2>
              {channel.description && (
                <p className="text-sm text-[#8b775b] line-clamp-2 mb-2">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-[#8b775b]/70">
                <span>
                  {channel.blockCount}{" "}
                  {channel.blockCount === 1 ? "block" : "blocks"}
                </span>
                {channel.collectionName && (
                  <>
                    <span>•</span>
                    <span>{channel.collectionName}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <ChannelForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
        channel={editingChannel}
        collections={collections}
      />
    </div>
  );
}
