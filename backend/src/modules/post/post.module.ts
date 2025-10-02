import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { PostRepository } from './post.repository'; // Import PostRepository
import { AiModule } from '@/ai/ai.module';
import { VectorModule } from '@/vector/vector.module';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    AiModule,
    VectorModule,
    forwardRef(() => UserModule), // forwardRef to avoid circular dependency
  ],
  controllers: [PostController],
  providers: [PostService, PostRepository], // Add PostRepository here
  exports: [PostService, PostRepository], // Export for use in other modules
})
export class PostModule {}
