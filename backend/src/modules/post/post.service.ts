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
import { UserRepository } from '@/modules/user/user.repository';

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
  private readonly mapCache = new Map<
    string,
    { expiresAt: number; data: { nodes: PostNode[]; edges: PostEdge[] } }
  >();
  private readonly MAP_CACHE_TTL_MS = 60 * 1000; // 60 seconds

  constructor(
    private readonly postRepository: PostRepository,
    private readonly aiService: AiService, // Inject AiService
    private readonly vectorService: VectorService, // Inject VectorService
    private readonly userRepository: UserRepository,
  ) {}

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    const newPost = await this.postRepository.createPost(createPostDto, author);
    this.generateAndSaveEmbedding(newPost);

    // 자동 AI 소개글 생성 트리거 (10개 간격)
    this.checkAndGenerateIntroduction(author.id);

    return newPost;
  }

  private async checkAndGenerateIntroduction(userId: number): Promise<void> {
    try {
      // 사용자의 총 포스트 개수 확인
      const userPosts = await this.postRepository.findAllByAuthorId(userId);
      const postCount = userPosts.length;

      // 10개 간격으로 자동 생성 (10, 20, 30, 40, ...)
      if (postCount >= 10 && postCount % 10 === 0) {
        this.logger.log(
          `Auto-generating AI introduction for user ${userId} (${postCount} posts)`,
        );

        // 최근 20개 글 가져오기
        const recentPosts = userPosts.slice(0, 20);
        const postsForAI = recentPosts.map((post) => ({
          title: post.title,
          content: post.content,
        }));

        // AI 소개글 생성
        const aiIntroduction =
          await this.aiService.generateIntroduction(postsForAI);

        // 사용자 정보 업데이트
        await this.userRepository.updateUser(userId, {
          aiIntroduction,
          lastIntroductionGenerated: new Date(),
        });

        this.logger.log(
          `Successfully auto-generated AI introduction for user ${userId}: "${aiIntroduction}"`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to auto-generate AI introduction for user ${userId}`,
        error.stack,
      );
    }
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
      this.logger.log(
        `Generating and updating embedding for post ${post.id}...`,
      );
      const embedding = await this.aiService.getEmbedding(
        `${post.title}\n\n${post.content}`,
      );
      await this.vectorService.updateEmbedding(
        post.id,
        embedding,
        post.content,
      );
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

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<PaginatedPostsResult> {
    const [data, total] = await this.postRepository.findAllPaginated(
      page,
      limit,
    );
    const totalPages = Math.ceil(total / limit);
    return { data, pagination: { page, limit, total, totalPages } };
  }

  async findByAuthorIdPaginated(
    authorId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedPostsResult> {
    const [data, total] = await this.postRepository.findByAuthorIdPaginated(
      authorId,
      page,
      limit,
    );
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

  async getPostsMap(params?: {
    threshold?: number;
    k?: number;
    maxNodes?: number;
    maxEdges?: number;
  }): Promise<{ nodes: PostNode[]; edges: PostEdge[] }> {
    const threshold = params?.threshold ?? 0.9;
    const k = params?.k ?? 3;
    const maxNodes = params?.maxNodes ?? 200;
    const maxEdges = params?.maxEdges ?? 2000;
    this.logger.log('Generating posts map...');

    const cacheKey = `postsMap:all:th=${threshold}:k=${k}:maxN=${maxNodes}:maxE=${maxEdges}`;
    const cached = this.mapCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    const allPosts = await this.postRepository.findAll();
    // 노드 상한 적용
    const limitedPosts = allPosts.slice(0, Math.max(0, maxNodes));
    const nodes: PostNode[] = limitedPosts.map((post) => ({
      id: post.id,
      title: post.title,
    }));
    if (limitedPosts.length < 2) return { nodes, edges: [] };

    const limitedPostIds = new Set(limitedPosts.map((p) => p.id));
    const allEmbeddings = await this.vectorService.getEmbeddingsByPostIds([
      ...limitedPostIds,
    ]);
    const edges: PostEdge[] = [];
    const edgeSet = new Set<string>();

    // 병렬 유사도 검색 (상수 k/threshold 적용)
    const searchResults = await Promise.all(
      allEmbeddings.map(({ post_id, embedding }) =>
        this.vectorService
          .searchSimilarPosts(embedding, threshold, k)
          .then((res) => ({ post_id, res })),
      ),
    );

    for (const { post_id, res } of searchResults) {
      for (const similar of res) {
        if (post_id === similar.post_id) continue;
        if (!limitedPostIds.has(similar.post_id)) continue;
        const source = Math.min(post_id, similar.post_id);
        const target = Math.max(post_id, similar.post_id);
        const edgeKey = `${source}-${target}`;
        if (!edgeSet.has(edgeKey)) {
          edges.push({ source, target, similarity: similar.similarity });
          edgeSet.add(edgeKey);
          if (edges.length >= maxEdges) break;
        }
      }
      if (edges.length >= maxEdges) break;
    }
    const result = { nodes, edges };
    this.mapCache.set(cacheKey, {
      expiresAt: Date.now() + this.MAP_CACHE_TTL_MS,
      data: result,
    });
    return result;
  }

  async getMyPostsMap(
    authorId: number,
    params?: {
      threshold?: number;
      k?: number;
      maxNodes?: number;
      maxEdges?: number;
    },
  ): Promise<{ nodes: PostNode[]; edges: PostEdge[] }> {
    const threshold = params?.threshold ?? 0.9;
    const k = params?.k ?? 3;
    const maxNodes = params?.maxNodes ?? 200;
    const maxEdges = params?.maxEdges ?? 2000;
    this.logger.log(`Generating posts map for author ${authorId}...`);

    const cacheKey = `postsMap:user:${authorId}:th=${threshold}:k=${k}:maxN=${maxNodes}:maxE=${maxEdges}`;
    const cached = this.mapCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    const userPosts = await this.postRepository.findAllByAuthorId(authorId);
    const limitedUserPosts = userPosts.slice(0, Math.max(0, maxNodes));
    const nodes: PostNode[] = limitedUserPosts.map((post) => ({
      id: post.id,
      title: post.title,
    }));
    if (limitedUserPosts.length < 2) return { nodes, edges: [] };

    const postIds = limitedUserPosts.map((post) => post.id);
    const userEmbeddings =
      await this.vectorService.getEmbeddingsByPostIds(postIds);
    const edges: PostEdge[] = [];
    const edgeSet = new Set<string>();

    const searchResults = await Promise.all(
      userEmbeddings.map(({ post_id, embedding }) =>
        this.vectorService
          .searchSimilarPosts(embedding, threshold, k)
          .then((res) => ({ post_id, res })),
      ),
    );

    for (const { post_id, res } of searchResults) {
      const similarUserPostIds = new Set(
        res.map((p) => p.post_id).filter((id) => postIds.includes(id)),
      );
      for (const similarId of similarUserPostIds) {
        if (post_id === similarId) continue;
        const source = Math.min(post_id, similarId);
        const target = Math.max(post_id, similarId);
        const edgeKey = `${source}-${target}`;
        if (!edgeSet.has(edgeKey)) {
          const similarity =
            res.find((p) => p.post_id === similarId)?.similarity || 0;
          edges.push({ source, target, similarity });
          edgeSet.add(edgeKey);
          if (edges.length >= maxEdges) break;
        }
      }
      if (edges.length >= maxEdges) break;
    }
    const result = { nodes, edges };
    this.mapCache.set(cacheKey, {
      expiresAt: Date.now() + this.MAP_CACHE_TTL_MS,
      data: result,
    });
    return result;
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    user: User,
  ): Promise<Post> {
    const post = await this.findById(id);
    if (post.author.id !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to update this post.',
      );
    }

    Object.assign(post, updatePostDto);
    const updatedPost = await this.postRepository.updatePost(post);

    // If content was updated, trigger embedding update in background
    if (updatePostDto.content || updatePostDto.title) {
      this.generateAndUpdateEmbedding(updatedPost);
    }

    return updatedPost;
  }

  async remove(id: number, user: User): Promise<void> {
    const post = await this.findById(id);
    if (post.author.id !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to delete this post.',
      );
    }

    await this.postRepository.remove(post);

    // Trigger embedding deletion in background
    try {
      this.logger.log(`Deleting embedding for post ${id}...`);
      await this.vectorService.deleteEmbedding(id);
      this.logger.log(`Successfully deleted embedding for post ${id}.`);
    } catch (error) {
      this.logger.error(
        `Failed to delete embedding for post ${id}`,
        error.stack,
      );
    }
  }
}
