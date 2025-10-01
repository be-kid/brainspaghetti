import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Form, Button, Alert } from "react-bootstrap"; // Import Form, Button, Alert
import { useToast } from "../contexts/ToastContext";
import { SpinnerInline } from "../components/Loading";

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // For initial data fetch
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/post/${id}`);
        setTitle(response.data.title);
        setContent(response.data.content);
      } catch (err) {
        setError("게시글 데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.patch(`/post/${id}`, { title, content });
      navigate(`/posts/${id}`); // Navigate back to the detail page
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(
          err.response.data.message || "게시글 수정 중 오류가 발생했습니다."
        );
        showToast({
          variant: "danger",
          message:
            err.response.data.message || "게시글 수정 중 오류가 발생했습니다.",
        });
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
        showToast({
          variant: "danger",
          message: "알 수 없는 오류가 발생했습니다.",
        });
      }
      console.error("Update post failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <p>게시글 불러오는 중...</p>;

  return (
    <div>
      <h1>게시글 수정</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formPostTitle">
          <Form.Label>제목</Form.Label>
          <Form.Control
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPostContent">
          <Form.Label>내용</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </Form.Group>

        {error && <Alert variant="danger">{error}</Alert>}

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <SpinnerInline /> 수정 중...
            </>
          ) : (
            "게시글 수정"
          )}
        </Button>
      </Form>
    </div>
  );
}
