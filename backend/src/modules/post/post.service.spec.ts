import { Test, TestingModule } from '@nestjs/testing';
import { PostService, PostEdge, PostNode } from './post.service';
import { PostRepository } from './post.repository';
import { AiService } from '@/ai/ai.service';
import { VectorService } from '@/vector/vector.service';
import { User } from '../user/entities/user.entity';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

// Mock services and repository
const mockPostRepository = {
  createPost: jest.fn(),
  findAll: jest.fn(),
};

const mockAiService = {
  getEmbedding: jest.fn(),
};

const mockVectorService = {
  saveEmbedding: jest.fn(),
  getAllEmbeddings: jest.fn(),
  searchSimilarPosts: jest.fn(),
};

describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PostRepository, useValue: mockPostRepository },
        { provide: AiService, useValue: mockAiService },
        { provide: VectorService, useValue: mockVectorService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        Logger,
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ... (describe blocks for 'create' and 'generateAndSaveEmbedding')
  describe('create', () => {
    it('should create a post and trigger embedding generation', async () => {
      const createPostDto: CreatePostDto = { title: 'Test', content: 'Test content' };
      const author = new User();
      author.id = 1;

      const newPost = new Post();
      newPost.id = 1;
      newPost.title = createPostDto.title;
      newPost.content = createPostDto.content;

      mockPostRepository.createPost.mockResolvedValue(newPost);

      const generateAndSaveEmbeddingSpy = jest.spyOn(
        service as any, 
        'generateAndSaveEmbedding',
      ).mockImplementation(() => Promise.resolve());

      const result = await service.create(createPostDto, author);

      expect(result).toEqual(newPost);
      expect(mockPostRepository.createPost).toHaveBeenCalledWith(createPostDto, author);
      expect(generateAndSaveEmbeddingSpy).toHaveBeenCalledWith(newPost);

      generateAndSaveEmbeddingSpy.mockRestore();
    });
  });

  describe('generateAndSaveEmbedding', () => {
    it('should call AiService and VectorService correctly', async () => {
      const post = new Post();
      post.id = 1;
      post.title = 'Test Title';
      post.content = 'Test Content';

      const mockEmbedding = [0.1, 0.2, 0.3];
      mockAiService.getEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorService.saveEmbedding.mockResolvedValue(undefined);

      await (service as any).generateAndSaveEmbedding(post);

      expect(mockAiService.getEmbedding).toHaveBeenCalledWith(`${post.title}\n\n${post.content}`);
      expect(mockVectorService.saveEmbedding).toHaveBeenCalledWith(
        post.id,
        mockEmbedding,
        post.content,
      );
    });

    it('should handle errors gracefully', async () => {
      const post = new Post();
      post.id = 2;
      post.title = 'Error Post';
      post.content = 'Error Content';

      const error = new Error('Embedding failed');
      mockAiService.getEmbedding.mockRejectedValue(error);

      await expect((service as any).generateAndSaveEmbedding(post)).resolves.not.toThrow();
      expect(mockVectorService.saveEmbedding).not.toHaveBeenCalled();
    });
  });

  describe('getPostsMap', () => {
    it('should return nodes and correctly deduplicated edges', async () => {
      // Arrange
      const posts: Post[] = [
        { id: 1, title: 'Post 1' } as Post,
        { id: 2, title: 'Post 2' } as Post,
        { id: 3, title: 'Post 3' } as Post,
      ];
      const embeddings = [
        { post_id: 1, embedding: [1, 0, 0] },
        { post_id: 2, embedding: [0.9, 0.1, 0] },
        { post_id: 3, embedding: [0, 1, 0] },
      ];

      mockPostRepository.findAll.mockResolvedValue(posts);
      mockVectorService.getAllEmbeddings.mockResolvedValue(embeddings);

      // Mock search results
      mockVectorService.searchSimilarPosts.mockImplementation(async (embedding) => {
        if (embedding[0] === 1) return [{ post_id: 2, similarity: 0.95 }]; // Post 1 is similar to 2
        if (embedding[0] === 0.9) return [{ post_id: 1, similarity: 0.95 }]; // Post 2 is similar to 1
        if (embedding[1] === 1) return []; // Post 3 is not similar to others
        return [];
      });

      // Act
      const result = await service.getPostsMap();

      // Assert
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes.map(n => n.id)).toEqual([1, 2, 3]);
      
      // Should only have one edge between 1 and 2, even though the relationship is found twice
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({ source: 1, target: 2, similarity: 0.95 });
    });

    it('should return no edges if there are less than 2 embeddings', async () => {
        mockPostRepository.findAll.mockResolvedValue([{ id: 1, title: 'Post 1' } as Post]);
        mockVectorService.getAllEmbeddings.mockResolvedValue([{ post_id: 1, embedding: [1,0,0] }]);

        const result = await service.getPostsMap();

        expect(result.nodes).toHaveLength(1);
        expect(result.edges).toHaveLength(0);
    });
  });
});
