import { Test, TestingModule } from '@nestjs/testing';
import { VectorService } from './vector.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { InternalServerErrorException } from '@nestjs/common';

// Mock the chainable Supabase client methods
const mockRpc = jest.fn();
const mockSingle = jest.fn();
// mockEq needs to return 'this' to allow chaining .single() after it.
const mockEq = jest.fn().mockReturnThis(); 
const mockSelect = jest.fn().mockReturnThis();
const mockInsert = jest.fn();
const mockFrom = jest.fn().mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  eq: mockEq,
  single: mockSingle,
});

// Mock the createClient function from the library
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

describe('VectorService', () => {
  let service: VectorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VectorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return 'http://fake.supabase.co';
              if (key === 'SUPABASE_KEY') return 'fake-anon-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<VectorService>(VectorService);
  });

  it('should be defined and create a client', () => {
    expect(service).toBeDefined();
    expect(createClient).toHaveBeenCalledWith('http://fake.supabase.co', 'fake-anon-key');
  });

  describe('saveEmbedding', () => {
    it('should call insert with correct data', async () => {
      mockInsert.mockResolvedValue({ error: null });
      await service.saveEmbedding(1, [0.1], 'content');
      expect(mockFrom).toHaveBeenCalledWith('post_embeddings');
      expect(mockInsert).toHaveBeenCalledWith({
        post_id: 1,
        embedding: [0.1],
        content: 'content',
      });
    });

    it('should throw an error if insert fails', async () => {
      mockInsert.mockResolvedValue({ error: new Error('Insert failed') });
      await expect(service.saveEmbedding(1, [0.1], 'content')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getEmbeddingByPostId', () => {
    it('should call select, eq, and single correctly', async () => {
      const mockEmbedding = [0.5];
      mockSingle.mockResolvedValue({ data: { embedding: mockEmbedding }, error: null });

      const result = await service.getEmbeddingByPostId(1);

      expect(result).toEqual(mockEmbedding);
      expect(mockFrom).toHaveBeenCalledWith('post_embeddings');
      expect(mockSelect).toHaveBeenCalledWith('embedding');
      expect(mockEq).toHaveBeenCalledWith('post_id', 1);
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should throw an error if select fails', async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error('Select failed') });
      await expect(service.getEmbeddingByPostId(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getAllEmbeddings', () => {
    it('should call select correctly', async () => {
      const mockEmbeddings = [{ post_id: 1, embedding: [0.1] }];
      // For non-chained methods, the mock from `from` is used directly
      mockFrom.mockReturnValue({ select: jest.fn().mockResolvedValue({ data: mockEmbeddings, error: null }) });

      const result = await service.getAllEmbeddings();

      expect(result).toEqual(mockEmbeddings);
      expect(mockFrom).toHaveBeenCalledWith('post_embeddings');
      expect(mockFrom().select).toHaveBeenCalledWith('post_id, embedding');
    });
  });

  describe('searchSimilarPosts', () => {
    it('should call rpc with correct parameters', async () => {
      const mockResponse = [{ post_id: 2, similarity: 0.9 }];
      mockRpc.mockResolvedValue({ data: mockResponse, error: null });

      const result = await service.searchSimilarPosts([0.1]);

      expect(result).toEqual(mockResponse);
      expect(mockRpc).toHaveBeenCalledWith('match_posts', {
        query_embedding: [0.1],
        match_threshold: 0.78,
        match_count: 5,
      });
    });
  });
});
