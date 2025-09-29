import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger, // Import Logger
} from '@nestjs/common';
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '@/modules/user/entities/user.entity';
import { Post } from './entities/post.entity';
import { AiService } from '@/ai/ai.service'; // Import AiService
import { VectorService } from '@/vector/vector.service'; // Import VectorService

export interface PostNode {
  id: number;
  title: string;
}

export interface PostEdge {
  source: number;
  target: number;
  similarity: number;
}

export interface PaginatedPostsResult {
  data: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name); // Initialize logger

  constructor(
    private readonly postRepository: PostRepository,
    private readonly aiService: AiService, // Inject AiService
    private readonly vectorService: VectorService, // Inject VectorService
  ) {}

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    const newPost = await this.postRepository.createPost(createPostDto, author);
    this.generateAndSaveEmbedding(newPost);
    return newPost;
  }

  private async generateAndSaveEmbedding(post: Post): Promise<void> {
    try {
      this.logger.log(`Generating embedding for post ${post.id}...`);
      const embedding = await this.aiService.getEmbedding(
        `${post.title}\n\n${post.content}`,
      );
      await this.vectorService.saveEmbedding(post.id, embedding, post.content);
      this.logger.log(`Successfully saved embedding for post ${post.id}.`);
    } catch (error) {
      this.logger.error(
        `Failed to generate or save embedding for post ${post.id}`,
        error.stack,
      );
    }
  }

  private async generateAndUpdateEmbedding(post: Post): Promise<void> {
    try {
      this.logger.log(`Generating and updating embedding for post ${post.id}...`);
      const embedding = await this.aiService.getEmbedding(
        `${post.title}\n\n${post.content}`,
      );
      await this.vectorService.updateEmbedding(post.id, embedding, post.content);
      this.logger.log(`Successfully updated embedding for post ${post.id}.`);
    } catch (error) {
      this.logger.error(
        `Failed to update embedding for post ${post.id}`,
        error.stack,
      );
    }
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.findAll();
  }

  async findAllPaginated(page: number, limit: number): Promise<PaginatedPostsResult> {
    const [data, total] = await this.postRepository.findAllPaginated(page, limit);
    const totalPages = Math.ceil(total / limit);
    return { data, pagination: { page, limit, total, totalPages } };
  }

  async findByAuthorIdPaginated(authorId: number, page: number, limit: number): Promise<PaginatedPostsResult> {
    const [data, total] = await this.postRepository.findByAuthorIdPaginated(authorId, page, limit);
    const totalPages = Math.ceil(total / limit);
    return { data, pagination: { page, limit, total, totalPages } };
  }

  async findById(id: number): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }
    return post;
  }

  async getPostsMap(): Promise<{ nodes: PostNode[]; edges: PostEdge[] }> {
    this.logger.log('Generating posts map...');
    const allPosts = await this.postRepository.findAll();
    const nodes: PostNode[] = allPosts.map((post) => ({ id: post.id, title: post.title }));
    if (allPosts.length < 2) return { nodes, edges: [] };

    const allEmbeddings = await this.vectorService.getAllEmbeddings();
    const edges: PostEdge[] = [];
    const edgeSet = new Set<string>();

    for (const { post_id, embedding } of allEmbeddings) {
      const similarPosts = await this.vectorService.searchSimilarPosts(embedding);
      for (const similar of similarPosts) {
        if (post_id === similar.post_id) continue;
        const source = Math.min(post_id, similar.post_id);
        const target = Math.max(post_id, similar.post_id);
        const edgeKey = `${source}-${target}`;
        if (!edgeSet.has(edgeKey)) {
          edges.push({ source, target, similarity: similar.similarity });
          edgeSet.add(edgeKey);
        }
      }
    }
    return { nodes, edges };
  }

  async getMyPostsMap(authorId: number): Promise<{ nodes: PostNode[]; edges: PostEdge[] }> {
    this.logger.log(`Generating posts map for author ${authorId}...`);
    const userPosts = await this.postRepository.findAllByAuthorId(authorId);
    const nodes: PostNode[] = userPosts.map((post) => ({ id: post.id, title: post.title }));
    if (userPosts.length < 2) return { nodes, edges: [] };

    const postIds = userPosts.map((post) => post.id);
    const userEmbeddings = await this.vectorService.getEmbeddingsByPostIds(postIds);
    const edges: PostEdge[] = [];
    const edgeSet = new Set<string>();

    for (const { post_id, embedding } of userEmbeddings) {
      const similarPosts = await this.vectorService.searchSimilarPosts(embedding);
      const similarUserPostIds = new Set(similarPosts.map(p => p.post_id).filter(id => postIds.includes(id)));
      for (const similarId of similarUserPostIds) {
        if (post_id === similarId) continue;
        const source = Math.min(post_id, similarId);
        const target = Math.max(post_id, similarId);
        const edgeKey = `${source}-${target}`;
        if (!edgeSet.has(edgeKey)) {
          const similarity = similarPosts.find(p => p.post_id === similarId)?.similarity || 0;
          edges.push({ source, target, similarity });
          edgeSet.add(edgeKey);
        }
      }
    }
    return { nodes, edges };
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    user: User,
  ): Promise<Post> {
    const post = await this.findById(id);
    if (post.author.id !== user.id) {
      throw new ForbiddenException('You are not authorized to update this post.');
    }

    Object.assign(post, updatePostDto);
    const updatedPost = await this.postRepository.updatePost(post);

    // If content was updated, trigger embedding update in background
    if (updatePostDto.content || updatePostDto.title) {
      this.generateAndUpdateEmbedding(updatedPost);
    }

    return updatedPost;
  }

  async remove(
    id: number,
    user: User,
  ): Promise<void> {
    const post = await this.findById(id);
    if (post.author.id !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this post.');
    }

    await this.postRepository.remove(post);

    // Trigger embedding deletion in background
    try {
      this.logger.log(`Deleting embedding for post ${id}...`);
      await this.vectorService.deleteEmbedding(id);
      this.logger.log(`Successfully deleted embedding for post ${id}.`);
    } catch (error) {
      this.logger.error(`Failed to delete embedding for post ${id}`, error.stack);
    }
  }
}
