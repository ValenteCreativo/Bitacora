"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";

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

interface GraphCanvasProps {
  graphData: { nodes: GraphNode[]; edges: GraphEdge[] };
  onNodeClick: (node: GraphNode) => void;
}

// Nautical-inspired color palette for clusters
const CLUSTER_COLORS = [
  "#1e3a5f", // deep navy
  "#2d5f8a", // ocean blue
  "#4a7c59", // sea moss
  "#8b4513", // driftwood
  "#c17817", // brass
  "#6b3a5b", // twilight plum
  "#2c4a3e", // kelp
  "#8b2252", // burgundy
  "#4a6741", // forest
  "#5c4a8a", // deep violet
];

// Type-specific shapes and styling
const TYPE_CONFIG: Record<GraphNode["type"], { baseSize: number; shape: "circle" | "diamond" | "square" | "hexagon"; borderColor: string }> = {
  COLLECTION: { baseSize: 16, shape: "hexagon", borderColor: "#2c2416" },
  CHANNEL: { baseSize: 12, shape: "diamond", borderColor: "#5c4a32" },
  TAG: { baseSize: 8, shape: "square", borderColor: "#8b775b" },
  BLOCK: { baseSize: 6, shape: "circle", borderColor: "transparent" },
};

export default function GraphCanvas({ graphData, onNodeClick }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Compute cluster assignments based on channels/collections
  const { nodeClusterMap, clusterNames } = useMemo(() => {
    const clusterMap: Record<string, number> = {};
    const names: Record<number, string> = {};
    let clusterIdx = 0;

    // Collections become cluster centers
    const collectionNodes = graphData.nodes.filter((n) => n.type === "COLLECTION");
    for (const coll of collectionNodes) {
      clusterMap[coll.id] = clusterIdx;
      names[clusterIdx] = coll.label;
      clusterIdx++;
    }

    // Channels inherit cluster from their collection (via edges)
    const channelNodes = graphData.nodes.filter((n) => n.type === "CHANNEL");
    for (const ch of channelNodes) {
      const collEdge = graphData.edges.find(
        (e) =>
          (e.source === ch.id && e.edgeType === "CHANNEL_IN_COLLECTION") ||
          (e.target === ch.id && e.edgeType === "CHANNEL_IN_COLLECTION")
      );
      if (collEdge) {
        const collId = collEdge.source === ch.id ? collEdge.target : collEdge.source;
        if (clusterMap[collId] !== undefined) {
          clusterMap[ch.id] = clusterMap[collId];
        }
      }
      if (clusterMap[ch.id] === undefined) {
        clusterMap[ch.id] = clusterIdx;
        names[clusterIdx] = ch.label;
        clusterIdx++;
      }
    }

    // Blocks inherit cluster from their primary channel
    const blockNodes = graphData.nodes.filter((n) => n.type === "BLOCK");
    for (const block of blockNodes) {
      const channelEdge = graphData.edges.find(
        (e) =>
          (e.source === block.id && e.edgeType === "BLOCK_IN_CHANNEL") ||
          (e.target === block.id && e.edgeType === "BLOCK_IN_CHANNEL")
      );
      if (channelEdge) {
        const chId = channelEdge.source === block.id ? channelEdge.target : channelEdge.source;
        if (clusterMap[chId] !== undefined) {
          clusterMap[block.id] = clusterMap[chId];
        }
      }
      if (clusterMap[block.id] === undefined) {
        // Check tags
        const tagEdge = graphData.edges.find(
          (e) =>
            (e.source === block.id && e.edgeType === "BLOCK_HAS_TAG") ||
            (e.target === block.id && e.edgeType === "BLOCK_HAS_TAG")
        );
        if (tagEdge) {
          const tagId = tagEdge.source === block.id ? tagEdge.target : tagEdge.source;
          if (clusterMap[tagId] !== undefined) {
            clusterMap[block.id] = clusterMap[tagId];
          }
        }
      }
      // Unassigned blocks get a default cluster
      if (clusterMap[block.id] === undefined) {
        clusterMap[block.id] = -1; // "uncharted"
      }
    }

    // Tags get cluster from their most connected block's cluster
    const tagNodes = graphData.nodes.filter((n) => n.type === "TAG");
    for (const tag of tagNodes) {
      const tagEdges = graphData.edges.filter(
        (e) =>
          (e.source === tag.id && e.edgeType === "BLOCK_HAS_TAG") ||
          (e.target === tag.id && e.edgeType === "BLOCK_HAS_TAG")
      );
      const connectedClusters = tagEdges
        .map((e) => {
          const blockId = e.source === tag.id ? e.target : e.source;
          return clusterMap[blockId];
        })
        .filter((c) => c !== undefined && c !== -1);
      
      if (connectedClusters.length > 0) {
        // Most frequent cluster
        const freq: Record<number, number> = {};
        for (const c of connectedClusters) {
          freq[c] = (freq[c] || 0) + 1;
        }
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        clusterMap[tag.id] = parseInt(sorted[0][0]);
      } else {
        clusterMap[tag.id] = -1;
      }
    }

    return { nodeClusterMap: clusterMap, clusterNames: names };
  }, [graphData]);

  // Compute connectivity for sizing
  const connectivity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const edge of graphData.edges) {
      const srcId = typeof edge.source === "object" ? (edge.source as any).id : edge.source;
      const tgtId = typeof edge.target === "object" ? (edge.target as any).id : edge.target;
      map[srcId] = (map[srcId] || 0) + 1;
      map[tgtId] = (map[tgtId] || 0) + 1;
    }
    return map;
  }, [graphData.edges]);

  // Get node color from cluster
  const getNodeColor = useCallback(
    (nodeId: string, type: GraphNode["type"]) => {
      const cluster = nodeClusterMap[nodeId];
      if (cluster === -1 || cluster === undefined) return "#8b775b"; // uncharted sand
      const baseColor = CLUSTER_COLORS[cluster % CLUSTER_COLORS.length];
      // Type affects opacity
      if (type === "COLLECTION") return baseColor;
      if (type === "CHANNEL") return baseColor;
      if (type === "TAG") return adjustAlpha(baseColor, 0.7);
      return adjustAlpha(baseColor, 0.85);
    },
    [nodeClusterMap]
  );

  // Transform data
  const data = useMemo(
    () => ({
      nodes: graphData.nodes.map((n) => ({
        ...n,
        val: Math.max(1, (connectivity[n.id] || 0) + 1),
        cluster: nodeClusterMap[n.id] ?? -1,
      })),
      links: graphData.edges.map((e) => ({
        ...e,
        source: e.source,
        target: e.target,
      })),
    }),
    [graphData, connectivity, nodeClusterMap]
  );

  const handleNodeClick = useCallback(
    (node: Record<string, unknown>) => {
      const graphNode = graphData.nodes.find((n) => n.id === node.id);
      if (graphNode) onNodeClick(graphNode);
    },
    [graphData.nodes, onNodeClick]
  );

  const handleNodeHover = useCallback((node: Record<string, unknown> | null) => {
    setHoveredNode(node ? (node.id as string) : null);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 bg-[#faf7f2]/90 backdrop-blur-sm border border-[#e8dfd2] rounded-lg px-3 py-2 text-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <svg width="12" height="12"><polygon points="6,1 11,6 6,11 1,6" fill="#2d5f8a" /></svg>
          <span className="text-[#5c4a32]">Channel</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="12" height="12"><rect x="2" y="2" width="8" height="8" fill="#c17817" /></svg>
          <span className="text-[#5c4a32]">Tag</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#4a7c59" /></svg>
          <span className="text-[#5c4a32]">Block</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="12" height="12"><polygon points="6,0 11,3 11,9 6,12 1,9 1,3" fill="#1e3a5f" /></svg>
          <span className="text-[#5c4a32]">Collection</span>
        </div>
        <div className="mt-2 pt-1.5 border-t border-[#e8dfd2]">
          <p className="text-[10px] text-[#8b775b]">Colors = topic clusters</p>
          <p className="text-[10px] text-[#8b775b]">Size = connections</p>
        </div>
      </div>

      <ForceGraph2D
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        nodeVal="val"
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        // Edge rendering
        linkWidth={(link: any) => {
          const weight = link.weight || 1;
          const edgeType = link.edgeType || "";
          if (edgeType === "BLOCK_IN_CHANNEL" || edgeType === "CHANNEL_IN_COLLECTION" || edgeType === "BLOCK_HAS_TAG") {
            return 0.5;
          }
          return Math.max(0.5, weight * 0.3);
        }}
        linkColor={(link: any) => {
          const edgeType = link.edgeType || "";
          if (edgeType === "BLOCK_IN_CHANNEL" || edgeType === "CHANNEL_IN_COLLECTION" || edgeType === "BLOCK_HAS_TAG") {
            return "rgba(139, 119, 91, 0.15)";
          }
          const weight = link.weight || 1;
          const opacity = Math.min(0.6, 0.1 + weight * 0.04);
          return `rgba(44, 36, 22, ${opacity})`;
        }}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const type = (node.type as GraphNode["type"]) || "BLOCK";
          const config = TYPE_CONFIG[type];
          const val = node.val || 1;
          const x = node.x || 0;
          const y = node.y || 0;
          const isHovered = hoveredNode === node.id;
          const label = (node.label as string) || "";

          const size = config.baseSize + Math.sqrt(val) * 2;
          const color = getNodeColor(node.id, type);
          const drawSize = isHovered ? size * 1.3 : size;

          // Draw glow for hovered
          if (isHovered) {
            ctx.beginPath();
            ctx.arc(x, y, drawSize + 4, 0, 2 * Math.PI);
            ctx.fillStyle = adjustAlpha(color, 0.15);
            ctx.fill();
          }

          // Draw shape
          ctx.beginPath();
          if (config.shape === "circle") {
            ctx.arc(x, y, drawSize / 2, 0, 2 * Math.PI);
          } else if (config.shape === "diamond") {
            const s = drawSize / 2;
            ctx.moveTo(x, y - s);
            ctx.lineTo(x + s, y);
            ctx.lineTo(x, y + s);
            ctx.lineTo(x - s, y);
            ctx.closePath();
          } else if (config.shape === "square") {
            const s = drawSize / 2.5;
            ctx.rect(x - s, y - s, s * 2, s * 2);
          } else if (config.shape === "hexagon") {
            const s = drawSize / 2;
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i - Math.PI / 6;
              const px = x + s * Math.cos(angle);
              const py = y + s * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
          }

          ctx.fillStyle = color;
          ctx.fill();

          // Border for channels and collections
          if (type === "COLLECTION" || type === "CHANNEL") {
            ctx.strokeStyle = config.borderColor;
            ctx.lineWidth = 1.5 / globalScale;
            ctx.stroke();
          }

          // Labels — always show for collections/channels, show for others when zoomed
          const showLabel =
            type === "COLLECTION" ||
            type === "CHANNEL" ||
            isHovered ||
            globalScale > 1.5 ||
            (type === "TAG" && globalScale > 0.8);

          if (showLabel) {
            const fontSize =
              type === "COLLECTION"
                ? Math.max(12 / globalScale, 4)
                : type === "CHANNEL"
                ? Math.max(10 / globalScale, 3.5)
                : Math.max(9 / globalScale, 3);

            ctx.font = `${type === "COLLECTION" ? "bold " : ""}${fontSize}px ${
              type === "COLLECTION" || type === "CHANNEL" ? "Georgia, serif" : "system-ui, sans-serif"
            }`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = isHovered ? "#2c2416" : "#5c4a32";

            const maxChars = type === "COLLECTION" ? 30 : type === "CHANNEL" ? 25 : 18;
            const truncated = label.length > maxChars ? label.substring(0, maxChars) + "…" : label;

            // Background pill for readability
            if (type === "COLLECTION" || type === "CHANNEL" || isHovered) {
              const textWidth = ctx.measureText(truncated).width;
              ctx.fillStyle = "rgba(250, 247, 242, 0.85)";
              ctx.fillRect(
                x - textWidth / 2 - 2,
                y + drawSize / 2 + 2,
                textWidth + 4,
                fontSize + 2
              );
            }

            ctx.fillStyle = isHovered ? "#2c2416" : "#5c4a32";
            ctx.fillText(truncated, x, y + drawSize / 2 + 3);
          }
        }}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const type = (node.type as GraphNode["type"]) || "BLOCK";
          const config = TYPE_CONFIG[type];
          const val = node.val || 1;
          const size = config.baseSize + Math.sqrt(val) * 2 + 4;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, size / 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        cooldownTicks={200}
        warmupTicks={50}
        backgroundColor="transparent"
        enableNodeDrag={true}
        enableZoomInteraction={true}
        minZoom={0.3}
        maxZoom={5}
      />
    </div>
  );
}

// Helper to adjust hex color opacity
function adjustAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
