import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

// Define the types for our data, consistent with PostListPage
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
  const { id } = useParams<{ id: string }>(); // Get the post ID from the URL
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
        setError('Failed to fetch post.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]); // Re-run the effect if the ID changes

  if (loading) return <p>Loading post...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <article>
      <h1>{post.title}</h1>
      <div style={{ color: '#555', marginBottom: '1rem' }}>
        <span>by {post.author.email}</span>
        <span style={{ marginLeft: '1rem' }}>
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
        {post.content}
      </div>
    </article>
  );
}