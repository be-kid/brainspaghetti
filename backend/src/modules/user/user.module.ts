import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { AiModule } from '../../ai/ai.module';
import { PostModule } from '../post/post.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AiModule,
    forwardRef(() => PostModule), // forwardRef to avoid circular dependency
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository], // Export UserService and UserRepository
})
export class UserModule {}
