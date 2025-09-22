import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { PostRepository } from './post.repository'; // Import PostRepository

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [PostController],
  providers: [PostService, PostRepository] // Add PostRepository here
})
export class PostModule {}
