"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import GraphSidePanel from "@/components/graph/GraphSidePanel";

// Dynamic import to avoid SSR issues with canvas-based library
const GraphCanvas = dynamic(() => import("@/components/graph/GraphCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500">
      Loading graph…
    </div>
  ),
});

interface GraphNode {
  id: string;
  type: "BLOCK" | "CHANNEL" | "TAG" | "COLLECTION";
  label: string;
  metadata: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  edgeType: string;
  weight: number;
  reason: string;
}

interface FilterOption {
  id: string;
  name: string;
}

export default function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Filters
  const [collectionFilter, setCollectionFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [minWeight, setMinWeight] = useState(1);

  // Filter options
  const [collectionOptions, setCollectionOptions] = useState<FilterOption[]>([]);
  const [channelOptions, setChannelOptions] = useState<FilterOption[]>([]);
  const [tagOptions, setTagOptions] = useState<FilterOption[]>([]);

  // Fetch filter options on mount
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [collectionsRes, channelsRes, tagsRes] = await Promise.all([
          fetch("/api/collections"),
          fetch("/api/channels"),
          fetch("/api/tags"),
        ]);

        if (collectionsRes.ok) {
          const data = await collectionsRes.json();
          setCollectionOptions(
            (data.collections || data || []).map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            }))
          );
        }
        if (channelsRes.ok) {
          const data = await channelsRes.json();
          setChannelOptions(
            (data.channels || data || []).map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            }))
          );
        }
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          setTagOptions(
            (data.tags || data || []).map((t: { id: string; name: string }) => ({
              id: t.id,
              name: t.name,
            }))
          );
        }
      } catch {
        // Silently handle filter options fetch failure
      }
    }
    fetchOptions();
  }, []);

  // Fetch graph data
  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (collectionFilter) params.set("collection", collectionFilter);
      if (channelFilter) params.set("channel", channelFilter);
      if (tagFilter) params.set("tag", tagFilter);
      if (minWeight > 1) params.set("minWeight", String(minWeight));

      const res = await fetch(`/api/graph?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      }
    } catch {
      // Handle fetch error silently
    } finally {
      setLoading(false);
    }
  }, [collectionFilter, channelFilter, tagFilter, minWeight]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3rem)" }}>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 rounded-t-lg">
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <span className="font-medium">Collection:</span>
          <select
            value={collectionFilter}
            onChange={(e) => {
              setCollectionFilter(e.target.value);
              setChannelFilter("");
              setTagFilter("");
            }}
            className="rounded border border-slate-300 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All</option>
            {collectionOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <span className="font-medium">Channel:</span>
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setCollectionFilter("");
              setTagFilter("");
            }}
            className="rounded border border-slate-300 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All</option>
            {channelOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <span className="font-medium">Tag:</span>
          <select
            value={tagFilter}
            onChange={(e) => {
              setTagFilter(e.target.value);
              setCollectionFilter("");
              setChannelFilter("");
            }}
            className="rounded border border-slate-300 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All</option>
            {tagOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <span className="font-medium">Min weight:</span>
          <input
            type="range"
            min={1}
            max={12}
            value={minWeight}
            onChange={(e) => setMinWeight(Number(e.target.value))}
            className="w-20 accent-indigo-500"
          />
          <span className="text-xs text-slate-500 w-4">{minWeight}</span>
        </label>

        <span className="ml-auto text-xs text-slate-500">
          {nodes.length} nodes · {edges.length} edges
        </span>
      </div>

      {/* Graph area */}
      <div className="flex-1 relative bg-slate-50 rounded-b-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">Loading graph…</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-500 mb-1">No nodes to display</p>
              <p className="text-sm text-slate-400">
                Save some blocks to see your knowledge graph
              </p>
            </div>
          </div>
        ) : (
          <GraphCanvas
            graphData={{ nodes, edges }}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* Side panel */}
        <GraphSidePanel
          node={selectedNode}
          edges={edges}
          nodes={nodes}
          onClose={handleClosePanel}
        />
      </div>
    </div>
  );
}
