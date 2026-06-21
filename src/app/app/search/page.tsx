"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { BlockCard } from "@/components/blocks/BlockCard";
import Link from "next/link";

interface BlockTag {
  id: string;
  name: string;
  slug: string;
}

interface SearchBlock {
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

interface SearchChannel {
  id: string;
  name: string;
  slug: string;
}

interface SearchCollection {
  id: string;
  name: string;
  slug: string;
}

interface SearchTag {
  id: string;
  name: string;
  slug: string;
}

interface SearchResults {
  blocks: SearchBlock[];
  channels: SearchChannel[];
  collections: SearchCollection[];
  tags: SearchTag[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);

    if (!q) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasResults =
    results &&
    (results.blocks.length > 0 ||
      results.channels.length > 0 ||
      results.collections.length > 0 ||
      results.tags.length > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search</h1>

      <SearchBar onSearch={handleSearch} />

      <div className="mt-8">
        {/* Initial state — no query */}
        {!query && !results && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              Search across all your blocks, channels, collections, and tags.
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg bg-white p-4 space-y-3"
                >
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!isLoading && query && results && !hasResults && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No results found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && hasResults && (
          <div className="space-y-8">
            {/* Blocks */}
            {results!.blocks.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Blocks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results!.blocks.map((block) => (
                    <BlockCard key={block.id} block={block} />
                  ))}
                </div>
              </section>
            )}

            {/* Channels */}
            {results!.channels.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Channels
                </h2>
                <div className="flex flex-wrap gap-2">
                  {results!.channels.map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/app/c/${channel.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.6 19.5m-2.1-19.5-3.6 19.5"
                        />
                      </svg>
                      {channel.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Collections */}
            {results!.collections.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Collections
                </h2>
                <div className="flex flex-wrap gap-2">
                  {results!.collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/app/collections/${collection.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                        />
                      </svg>
                      {collection.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {results!.tags.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {results!.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/app/tags/${tag.slug}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
