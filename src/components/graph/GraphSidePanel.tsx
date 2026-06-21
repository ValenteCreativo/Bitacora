"use client";

import Link from "next/link";

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

interface GraphSidePanelProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  nodes: GraphNode[];
  onClose: () => void;
}

const TYPE_BADGES: Record<GraphNode["type"], { label: string; color: string }> = {
  BLOCK: { label: "Block", color: "bg-indigo-100 text-indigo-700" },
  CHANNEL: { label: "Channel", color: "bg-emerald-100 text-emerald-700" },
  TAG: { label: "Tag", color: "bg-amber-100 text-amber-700" },
  COLLECTION: { label: "Collection", color: "bg-red-100 text-red-700" },
};

function getNodeDetailPath(node: GraphNode): string {
  switch (node.type) {
    case "BLOCK":
      return `/app/b/${node.id}`;
    case "CHANNEL":
      return `/app/c/${node.metadata.slug || node.id}`;
    case "TAG":
      return `/app/tags/${node.metadata.slug || node.id}`;
    case "COLLECTION":
      return `/app/collections/${node.metadata.slug || node.id}`;
  }
}

export default function GraphSidePanel({ node, edges, nodes, onClose }: GraphSidePanelProps) {
  if (!node) return null;

  // Find edges connected to this node
  const connectedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );

  // Get connected node IDs with their edge info
  const connections = connectedEdges.map((edge) => {
    const connectedId = edge.source === node.id ? edge.target : edge.source;
    const connectedNode = nodes.find((n) => n.id === connectedId);
    return {
      edge,
      node: connectedNode,
    };
  });

  const badge = TYPE_BADGES[node.type];

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-lg z-50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
          {badge.label}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Node info */}
      <div className="px-4 py-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">{node.label}</h2>

        {/* Metadata */}
        <div className="space-y-1 text-sm text-slate-600">
          {node.metadata.domain ? (
            <p className="truncate">
              <span className="font-medium">Domain:</span> {String(node.metadata.domain)}
            </p>
          ) : null}
          {node.metadata.slug ? (
            <p className="truncate">
              <span className="font-medium">Slug:</span> {String(node.metadata.slug)}
            </p>
          ) : null}
          {node.metadata.type ? (
            <p>
              <span className="font-medium">Type:</span> {String(node.metadata.type)}
            </p>
          ) : null}
        </div>

        {/* Link to detail page */}
        <Link
          href={getNodeDetailPath(node)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          View details
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* Connected nodes */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <h3 className="text-sm font-medium text-slate-700 mb-2">
          Connections ({connections.length})
        </h3>

        {connections.length === 0 ? (
          <p className="text-sm text-slate-500">No connections found.</p>
        ) : (
          <ul className="space-y-2">
            {connections.map(({ edge, node: connNode }) => (
              <li
                key={edge.id}
                className="rounded-md border border-slate-100 p-2 hover:bg-slate-50 transition-colors"
              >
                {connNode ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_BADGES[connNode.type].color}`}
                      >
                        {TYPE_BADGES[connNode.type].label}
                      </span>
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {connNode.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 truncate">
                      {edge.reason || edge.edgeType} (weight: {edge.weight})
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Unknown node</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
