import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { PostRepository } from './post.repository'; // Import PostRepository
import { AiModule } from '@/ai/ai.module';
import { VectorModule } from '@/vector/vector.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), AiModule, VectorModule],
  controllers: [PostController],
  providers: [PostService, PostRepository], // Add PostRepository here
})
export class PostModule {}
