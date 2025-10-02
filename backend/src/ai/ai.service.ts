import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      console.warn('OpenAI API key not found. AI features will be disabled.');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new InternalServerErrorException('OpenAI API key not configured');
    }
    
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Error creating embedding:', error);
      throw new InternalServerErrorException(
        'Failed to create text embedding.',
      );
    }
  }

  async generateIntroduction(
    posts: { title: string; content: string }[],
  ): Promise<string> {
    if (!this.openai) {
      throw new InternalServerErrorException('OpenAI API key not configured');
    }
    
    try {
      // 최근 20개 글만 사용
      const recentPosts = posts.slice(0, 20);

      // 글들을 하나의 텍스트로 합치기
      const postsText = recentPosts
        .map((post, index) => `${index + 1}. ${post.title}: ${post.content}`)
        .join('\n\n');

      const prompt = `다음은 한 사용자가 작성한 글들입니다. 이 글들을 바탕으로 이 사람의 성격이나 관심사를 파악해서 한 줄 소개글을 만들어주세요.

글 목록:
${postsText}

조건:
- 한 문장으로 최대 50자 이내
- 솔직하고 개성있게 표현 (긍정적이든 부정적이든 상관없음)
- "OO한 사람", "OO하는 개발자" 등 자유로운 형식
- 예시: "세상에 불만이 많은 현실적인 개발자", "기술과 일상을 연결하는 호기심 많은 사람"

한 줄 소개글:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.8, // 창의적인 답변을 위해 높은 temperature
      });

      const introduction = response.choices[0]?.message?.content?.trim();

      if (!introduction) {
        throw new Error('No introduction generated');
      }

      return introduction;
    } catch (error) {
      console.error('Error generating introduction:', error);
      throw new InternalServerErrorException(
        'Failed to generate AI introduction.',
      );
    }
  }
}
