import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post)
    private typeOrmRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const newPost = this.typeOrmRepository.create(createPostDto);
    return await this.typeOrmRepository.save(newPost);
  }
}