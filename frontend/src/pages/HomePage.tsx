import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Network } from 'vis-network';
import type { Node, Edge, Options } from 'vis-network';
import { Row, Col, Card, Button } from 'react-bootstrap'; // Import Row, Col, Card, Button

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
  pagination: { totalPages: number; };
}
interface MapResponse {
  nodes: { id: number; title: string; }[];
  edges: { source: number; target: number; similarity: number; }[];
}

export default function HomePage() {
  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // State for Post List
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State for Mind Map
  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const visJsRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);
  const navigate = useNavigate();

  // Common state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect for fetching post list
  useEffect(() => {
    if (viewMode !== 'list') return;
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<PaginatedPostsResponse>('/post', { params: { page, limit: 10 } });
        setPosts(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      } catch (err) {
        setError('Failed to fetch posts.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page, viewMode]);

  // Effect for fetching map data
  useEffect(() => {
    if (viewMode !== 'map') return;

    const fetchMapData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<MapResponse>('/post/map');
        setMapData(response.data);
      } catch (err) {
        setError('Failed to load mind map data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [viewMode]);

  // Effect for DRAWING the mind map (triggers when mapData is ready)
  useEffect(() => {
    if (viewMode !== 'map' || !mapData || !visJsRef.current) return;

    const nodes: Node[] = mapData.nodes.map(node => ({ id: node.id, label: node.title }));
    const edges: Edge[] = mapData.edges.map(edge => ({ from: edge.source, to: edge.target, value: edge.similarity }));

    // If there are nodes but no edges, it means no connections were found.
    // Inform the user instead of showing a blank map.
    if (nodes.length > 0 && edges.length === 0) {
      setError('연관 관계를 표시하려면 2개 이상의 게시글이 필요합니다.');
      return;
    }

    const data = { nodes, edges };
    const options: Options = {
      nodes: {
        shape: 'box',
        margin: 10,
        font: { size: 14 }
      },
      edges: {
        arrows: 'to',
        smooth: { type: 'continuous' }
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based'
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true
      }
    };

    networkInstance.current?.destroy();
    networkInstance.current = new Network(visJsRef.current, data, options);
    networkInstance.current.on('doubleClick', params => {
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
                <Card.Subtitle className="mb-2 text-muted">by {post.author.email}</Card.Subtitle>
                <Card.Text>
                  {post.content.substring(0, 100)}...
                </Card.Text>
                <Link to={`/posts/${post.id}`}><Button variant="primary">자세히 보기</Button></Link>
              </Card.Body>
              <Card.Footer className="text-muted">
                <small>{new Date(post.createdAt).toLocaleDateString()}</small>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
      {posts.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <Button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page <= 1}>이전</Button>
          <span>Page {page} of {totalPages}</span>
          <Button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page >= totalPages}>다음</Button>
        </div>
      )}
    </>
  );

  const renderMapView = () => (
    <div ref={visJsRef} style={{ height: '70vh', border: '1px solid #ccc' }} />
  );

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <Button onClick={() => setViewMode('list')} disabled={viewMode === 'list'}>목록 보기</Button>
        <Button onClick={() => setViewMode('map')} disabled={viewMode === 'map'}>마인드맵 보기</Button>
      </div>
      <h1>{viewMode === 'list' ? '전체 글' : '마인드맵'}</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        viewMode === 'list' ? renderListView() : renderMapView()
      )}
    </div>
  );
}
