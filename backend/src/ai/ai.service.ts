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

      const prompt = `다음은 한 사용자가 작성한 글들입니다. 이 글들을 바탕으로 이 사람의 성격이나 관심사를 파악해서 독특하고 재치있는 한 줄 각인을 만들어주세요.

글 목록:
${postsText}

조건:
- 한 문장으로 최대 60자 이내
- 주술회전 분위기를 살린 멋있고 개성있는 표현 사용
- 약간의 과장이나 유머를 섞어서 읽는 사람이 피식 웃을 수 있게
- 딱딱하지 않고 센스있게 표현
- 인용 부호("")는 붙이지 말 것

예시 스타일:
- "커피 주력으로 새벽을 지배하는 야행성 개발자"
- "버그라는 이름의 저주령을 퇴치하는 디버거"
- "복붙이라는 무한의 영역을 전개한 실용주의자"
- "잡념이 폭주하는 무한의 뇌공간 보유자"
- "StackOverflow를 주술식으로 사용하는 현대의 주술사"
- "마감이라는 특급 주령을 상대하는 노련한 술사"

주술사의 각인:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.9, // 더 창의적이고 재미있는 답변을 위해 높은 temperature
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
