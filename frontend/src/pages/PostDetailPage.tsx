import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

// Define the types for our data
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

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth(); // Get current user
  const { isAuthenticated, authToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get<Post>(`/post/${id}`);
        setPost(response.data);
      } catch (err) {
        setError("Failed to fetch post.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await api.delete(`/post/${id}`);
        navigate("/");
      } catch (err) {
        console.error(err);
        showToast({
          variant: "danger",
          message: "게시글 삭제에 실패했습니다.",
        });
      }
    }
  };

  if (loading) return <p>Loading post...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!post) return <p>Post not found.</p>;

  const isAuthor = user?.id === post.author.id;

  return (
    <article>
      <h1>{post.title}</h1>
      <div
        style={{
          color: "#555",
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span>by {post.author.email}</span>
          <span style={{ marginLeft: "1rem" }}>
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
        {isAuthor && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link to={`/posts/${id}/edit`}>
              <button>수정</button>
            </Link>
            <button
              onClick={handleDelete}
              style={{ backgroundColor: "#dc3545", color: "white" }}
            >
              삭제
            </button>
          </div>
        )}
      </div>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
        {post.content}
      </div>
    </article>
  );
}
