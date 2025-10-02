import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Network } from "vis-network";
import type { Node, Edge, Options } from "vis-network";
import { Row, Col, Card, Button } from "react-bootstrap"; // Import Row, Col, Card, Button

// Common types
interface Author {
  id: number;
  email: string;
}
interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: Author;
}

// Types for API responses
interface PaginatedPostsResponse {
  data: Post[];
  pagination: { totalPages: number };
}
interface MapResponse {
  nodes: { id: number; title: string }[];
  edges: { source: number; target: number; similarity: number }[];
}

export default function HomePage() {
  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // State for Post List
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State for Mind Map
  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const visJsRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);
  const navigate = useNavigate();
  const [threshold, setThreshold] = useState<number>(0.9);
  const [sliderThreshold, setSliderThreshold] = useState<number>(0.9);
  const [k, setK] = useState<number>(3);

  // Common state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect for fetching post list
  useEffect(() => {
    if (viewMode !== "list") return;
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<PaginatedPostsResponse>("/post", {
          params: { page, limit: 10 },
        });
        setPosts(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      } catch (err) {
        setError("Failed to fetch posts.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page, viewMode]);

  // Effect for fetching map data
  useEffect(() => {
    if (viewMode !== "map") return;

    const fetchMapData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<MapResponse>("/post/map", {
          params: { threshold, k, maxNodes: 200, maxEdges: 2000 },
        });
        setMapData(response.data);
      } catch (err) {
        setError("Failed to load mind map data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [viewMode, threshold, k]);

  // Effect for DRAWING the mind map (triggers when mapData is ready)
  useEffect(() => {
    if (viewMode !== "map" || !mapData || !visJsRef.current) return;

    const nodes: Node[] = mapData.nodes.map((node) => ({
      id: node.id,
      label: node.title,
    }));
    const edges: Edge[] = mapData.edges.map((edge) => ({
      from: edge.source,
      to: edge.target,
      value: edge.similarity,
    }));

    // 영역전개 애니메이션: 모든 노드를 중앙에서 시작
    const centerX = 0;
    const centerY = 0;
    const nodesWithCenterPositions = nodes.map((node) => ({
      ...node,
      x: centerX,
      y: centerY,
    }));

    const data = { nodes: nodesWithCenterPositions, edges };
    const options: Options = {
      nodes: {
        shape: "box",
        margin: 15,
        font: {
          size: 16,
          face: "Inter, SF Pro Display, sans-serif",
          color: "#ffffff",
          strokeWidth: 2,
          strokeColor: "#000000",
        },
        borderWidth: 3,
        borderWidthSelected: 4,
        size: 25,
        color: {
          background: "#4a148c",
          border: "#ff6b35",
          highlight: {
            background: "#8e24aa",
            border: "#ff8a50",
          },
          hover: {
            background: "#6a1b9a",
            border: "#ff8a50",
          },
        },
        scaling: {
          min: 20,
          max: 40,
        },
        shadow: {
          enabled: true,
          color: "rgba(255, 107, 53, 0.4)",
          size: 10,
          x: 0,
          y: 4,
        },
      },
      edges: {
        smooth: false,
        color: {
          color: "#ff6b35",
          highlight: "#ff8a50",
          hover: "#ff8a50",
          opacity: 0.8,
        },
        width: 0.5,
        selectionWidth: 1,
        shadow: {
          enabled: true,
          color: "rgba(255, 107, 53, 0.3)",
          size: 5,
          x: 0,
          y: 2,
        },
      },
      physics: {
        enabled: true,
        stabilization: {
          enabled: false, // 자동 안정화 비활성화
        },
        barnesHut: {
          gravitationalConstant: -800, // 더 약한 중력
          centralGravity: 0.05, // 더 약한 중앙 중력
          springLength: 300, // 더 긴 스프링
          springConstant: 0.01, // 더 약한 스프링
          damping: 0.3, // 더 강한 댐핑 (느린 움직임)
          avoidOverlap: 1,
        },
        timestep: 0.3, // 더 느린 시뮬레이션
        adaptiveTimestep: true,
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
      },
    };

    networkInstance.current?.destroy();
    networkInstance.current = new Network(visJsRef.current, data, options);

    // 영역전개 애니메이션: 3초 후 물리 엔진 비활성화
    setTimeout(() => {
      networkInstance.current?.setOptions({ physics: { enabled: false } });
    }, 3000);
    networkInstance.current.on("doubleClick", (params) => {
      if (params.nodes.length > 0) navigate(`/posts/${params.nodes[0]}`);
    });

    return () => {
      networkInstance.current?.destroy();
    };
  }, [mapData, viewMode, navigate]); // Depends on mapData now

  // Render functions for each view
  const renderListView = () => (
    <>
      {posts.length === 0 && !loading && <p>게시글이 없습니다.</p>}
      <Row xs={1} md={2} className="g-4">
        {posts.map((post) => (
          <Col key={post.id}>
            <Card>
              <Card.Body>
                <Card.Title>{post.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  by {post.author.email}
                </Card.Subtitle>
                <Card.Text>{post.content.substring(0, 100)}...</Card.Text>
                <Link to={`/posts/${post.id}`}>
                  <Button variant="primary">자세히 보기</Button>
                </Link>
              </Card.Body>
              <Card.Footer className="text-muted">
                <small>{new Date(post.createdAt).toLocaleDateString()}</small>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
      {posts.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <Button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
          >
            이전
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </>
  );

  const renderMapView = () => (
    <>
      <div
        className="mindmap-controls"
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>유사도 임계값: {sliderThreshold.toFixed(2)}</span>
          <input
            type="range"
            min={0.8}
            max={0.98}
            step={0.01}
            value={sliderThreshold}
            onChange={(e) => setSliderThreshold(parseFloat(e.target.value))}
            onMouseUp={() => setThreshold(sliderThreshold)}
            onTouchEnd={() => setThreshold(sliderThreshold)}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>연결 개수 k:</span>
          <select
            value={k}
            onChange={(e) => setK(parseInt(e.target.value, 10))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        ref={visJsRef}
        className="mindmap-container mindmap-expansion"
        style={{ height: "70vh" }}
      />
    </>
  );

  return (
    <div>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
        <Button
          onClick={() => setViewMode("list")}
          disabled={viewMode === "list"}
        >
          목록 보기
        </Button>
        <Button
          onClick={() => setViewMode("map")}
          disabled={viewMode === "map"}
        >
          마인드맵 보기
        </Button>
      </div>
      {loading && <div className="mindmap-loading"></div>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading &&
        !error &&
        (viewMode === "list" ? renderListView() : renderMapView())}
    </div>
  );
}
