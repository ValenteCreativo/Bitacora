"use client";

import { useRef, useCallback, useEffect, useState } from "react";
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

const NODE_COLORS: Record<GraphNode["type"], string> = {
  BLOCK: "#6366f1",
  CHANNEL: "#10b981",
  TAG: "#f59e0b",
  COLLECTION: "#ef4444",
};

export default function GraphCanvas({ graphData, onNodeClick }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  // Compute connectivity map for node sizing
  const connectivityMap = useCallback(() => {
    const map: Record<string, number> = {};
    for (const edge of graphData.edges) {
      map[edge.source] = (map[edge.source] || 0) + 1;
      map[edge.target] = (map[edge.target] || 0) + 1;
    }
    return map;
  }, [graphData.edges]);

  const connectivity = connectivityMap();

  // Transform data for react-force-graph-2d
  const data = {
    nodes: graphData.nodes.map((n) => ({
      ...n,
      val: Math.max(1, connectivity[n.id] || 1),
    })),
    links: graphData.edges.map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    })),
  };

  const handleNodeClick = useCallback(
    (node: Record<string, unknown>) => {
      const graphNode = graphData.nodes.find((n) => n.id === node.id);
      if (graphNode) {
        onNodeClick(graphNode);
      }
    },
    [graphData.nodes, onNodeClick]
  );

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        nodeVal="val"
        nodeLabel={(node: Record<string, unknown>) => node.label as string}
        nodeColor={(node: Record<string, unknown>) =>
          NODE_COLORS[(node.type as GraphNode["type"]) || "BLOCK"]
        }
        linkWidth={(link: Record<string, unknown>) =>
          Math.max(0.5, ((link.weight as number) || 1) * 0.5)
        }
        linkColor={() => "rgba(148, 163, 184, 0.6)"}
        onNodeClick={handleNodeClick}
        nodeCanvasObject={(node: Record<string, unknown>, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = (node.label as string) || "";
          const type = (node.type as GraphNode["type"]) || "BLOCK";
          const val = (node.val as number) || 1;
          const x = (node.x as number) || 0;
          const y = (node.y as number) || 0;

          const size = Math.sqrt(val) * 4 + 3;
          const color = NODE_COLORS[type];

          // Draw node circle
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();

          // Draw label if zoomed in enough
          if (globalScale > 1.2) {
            const fontSize = Math.max(10 / globalScale, 2);
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#334155";
            const truncated = label.length > 20 ? label.substring(0, 20) + "…" : label;
            ctx.fillText(truncated, x, y + size + 2);
          }
        }}
        nodePointerAreaPaint={(node: Record<string, unknown>, color: string, ctx: CanvasRenderingContext2D) => {
          const val = (node.val as number) || 1;
          const size = Math.sqrt(val) * 4 + 3;
          const x = (node.x as number) || 0;
          const y = (node.y as number) || 0;
          ctx.beginPath();
          ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        cooldownTicks={100}
        backgroundColor="transparent"
      />
    </div>
  );
}
