import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Network } from "vis-network";
import type { Node, Edge, Options } from "vis-network";
import { Row, Col, Card, Button } from "react-bootstrap"; // Import Row, Col, Card, Button
import { useAuth } from "../contexts/AuthContext";

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
interface User {
  id: number;
  email: string;
  aiIntroduction?: string;
  lastIntroductionGenerated?: string;
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

export default function ProfilePage() {
  const { isLoggedIn, user: authUser, isLoading } = useAuth();
  const navigate = useNavigate();

  // 로그인 체크 - 로딩이 완료된 후에만 실행
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
      return;
    }
  }, [isLoggedIn, isLoading, navigate]);

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
  const [threshold, setThreshold] = useState<number>(0.9);
  const [sliderThreshold, setSliderThreshold] = useState<number>(0.9);
  const [k, setK] = useState<number>(3);

  // User profile state
  const [user, setUser] = useState<User | null>(null);
  const [aiIntroLoading, setAiIntroLoading] = useState(false);

  // Common state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect for fetching user profile
  useEffect(() => {
    if (isLoading || !isLoggedIn || !authUser) return;

    const fetchUserProfile = async () => {
      try {
        const response = await api.get<User>("/user/me");
        setUser(response.data);
      } catch (err: any) {
        console.error("Failed to fetch user profile:", err);
        if (err.response?.status === 401) {
          // 토큰이 만료되었거나 유효하지 않음
          navigate("/login");
        }
      }
    };
    fetchUserProfile();
  }, [isLoading, isLoggedIn, authUser, navigate]);

  // Function to generate AI introduction
  const generateAiIntroduction = async () => {
    if (!user) return;

    setAiIntroLoading(true);
    try {
      const response = await api.post<{ aiIntroduction: string }>(
        "/user/generate-introduction"
      );
      setUser((prev) =>
        prev ? { ...prev, aiIntroduction: response.data.aiIntroduction } : null
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "AI 소개글 생성에 실패했습니다.";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setAiIntroLoading(false);
    }
  };

  // Effect for fetching post list
  useEffect(() => {
    if (viewMode !== "list") return;
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<PaginatedPostsResponse>("/post/me", {
          params: { page, limit: 10 },
        });
        setPosts(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      } catch (err) {
        setError("Failed to fetch your posts.");
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
        const response = await api.get<MapResponse>("/post/me/map", {
          params: { threshold, k, maxNodes: 200, maxEdges: 2000 },
        });
        setMapData(response.data);
      } catch (err) {
        setError("Failed to load your mind map data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [viewMode, threshold, k]);

  // Effect for DRAWING the mind map
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
      if (params.nodes.length > 0) navigate(`/posts/${params.nodes[0]}`, { state: { from: '/profile' } });
    });

    return () => {
      networkInstance.current?.destroy();
    };
  }, [mapData, viewMode, navigate]);

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
                <Link to={`/posts/${post.id}`} state={{ from: '/profile' }}>
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
          <span style={{ color: '#e8e8e8' }}>
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

  // AuthContext가 로딩 중이면 로딩 표시
  if (isLoading) {
    return <div className="mindmap-loading">인증 정보를 확인하는 중...</div>;
  }

  // 로그인되지 않은 경우 (로딩 완료 후)
  if (!isLoggedIn) {
    return null; // navigate가 실행되므로 아무것도 렌더링하지 않음
  }

  return (
    <div>
      {/* AI 소개글 섹션 */}
      <Card style={{ marginBottom: "2rem" }}>
        <Card.Body>
          <Card.Title
            style={{ display: "flex", alignItems: "center", gap: "1rem" }}
          >
            🤖 AI 한줄소개
            <Button
              size="sm"
              onClick={generateAiIntroduction}
              disabled={aiIntroLoading || !user}
              style={{ fontSize: "0.8rem" }}
            >
              {aiIntroLoading ? "생성 중..." : "새로 생성"}
            </Button>
          </Card.Title>
          {!user ? (
            <Card.Text style={{ color: "#888" }}>
              사용자 정보를 불러오는 중...
            </Card.Text>
          ) : user.aiIntroduction ? (
            <Card.Text
              style={{
                fontSize: "1.1rem",
                fontStyle: "italic",
                color: "#00bcd4",
              }}
            >
              "{user.aiIntroduction}"
            </Card.Text>
          ) : (
            <Card.Text style={{ color: "#888" }}>
              AI 소개글이 없습니다. 10개 이상의 글을 작성하면 자동으로
              생성되거나, 직접 생성할 수 있습니다.
            </Card.Text>
          )}
          {user?.lastIntroductionGenerated && (
            <small style={{ color: "#666" }}>
              마지막 생성:{" "}
              {new Date(user.lastIntroductionGenerated).toLocaleDateString()}
            </small>
          )}
        </Card.Body>
      </Card>

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
