import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';

// Create a reusable mock client instance
const mockEmbeddingsCreate = jest.fn();
const mockOpenAIClient = {
  embeddings: {
    create: mockEmbeddingsCreate,
  },
};

// Mock the entire 'openai' library
jest.mock('openai', () => {
  // When the OpenAI constructor is called, return our mock client
  return jest.fn().mockImplementation(() => mockOpenAIClient);
});

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    // Clear mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('fake-openai-key'),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEmbedding', () => {
    it('should call openai.embeddings.create and return an embedding', async () => {
      const testText = 'hello world';
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4];
      const mockApiResponse = {
        data: [{ embedding: mockEmbedding }],
      };

      mockEmbeddingsCreate.mockResolvedValue(mockApiResponse);

      const result = await service.getEmbedding(testText);

      expect(result).toEqual(mockEmbedding);
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: testText,
      });
    });

    it('should throw an InternalServerErrorException if the API call fails', async () => {
      mockEmbeddingsCreate.mockRejectedValue(new Error('API Error'));

      await expect(service.getEmbedding('test')).rejects.toThrow(InternalServerErrorException);
    });
  });
});
