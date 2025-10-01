import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Network } from "vis-network";
import type { Node, Edge, Options } from "vis-network";
import api from "../services/api";

// Backend data types
interface PostNode {
  id: number;
  title: string;
}

interface PostEdge {
  source: number;
  target: number;
  similarity: number;
}

export default function MindMapPage() {
  const visJsRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const drawMap = async () => {
      if (!visJsRef.current) {
        return;
      }

      try {
        setLoading(true);
        const response = await api.get<{
          nodes: PostNode[];
          edges: PostEdge[];
        }>("/post/map", {
          params: { threshold: 0.9, k: 3, maxNodes: 200, maxEdges: 2000 },
        });
        const { nodes: apiNodes, edges: apiEdges } = response.data;

        // Transform data for vis-network
        const nodes: Node[] = apiNodes.map((node) => ({
          id: node.id,
          label: node.title,
        }));

        const edges: Edge[] = apiEdges.map((edge) => ({
          from: edge.source,
          to: edge.target,
          value: edge.similarity, // Use similarity for edge width or value
        }));

        const data = { nodes, edges };

        const options: Options = {
          nodes: {
            shape: "box",
            margin: 10,
            font: {
              size: 14,
            },
          },
          edges: {
            smooth: false,
          },
          physics: {
            enabled: true,
            stabilization: { iterations: 200 },
          },
          interaction: {
            dragNodes: true,
            dragView: true,
            zoomView: true,
          },
        };

        const network = new Network(visJsRef.current, data, options);

        network.once("stabilized", () => {
          network.setOptions({ physics: { enabled: false } });
        });

        // Add double-click event listener
        network.on("doubleClick", (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            navigate(`/posts/${nodeId}`);
          }
        });
      } catch (err) {
        setError("Failed to load mind map data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    drawMap();
  }, [navigate]);

  return (
    <div>
      <h1>Mind Map</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div
        ref={visJsRef}
        style={{
          height: "70vh",
          border: "1px solid #ccc",
          background: "#f9f9f9",
        }}
      />
      {loading && <p>Loading map...</p>}
    </div>
  );
}
