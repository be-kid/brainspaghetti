import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '@/modules/user/entities/user.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(Post)
    private readonly genericPostRepository: Repository<Post>,
  ) {}

  async createPost(createPostDto: CreatePostDto, author: User): Promise<Post> {
    const newPost = this.genericPostRepository.create({
      ...createPostDto,
      author,
    });
    return this.genericPostRepository.save(newPost);
  }

  async findAll(): Promise<Post[]> {
    return this.genericPostRepository.find({ relations: ['author'] });
  }

  async findById(id: number): Promise<Post | null> {
    return this.genericPostRepository.findOne({ where: { id }, relations: ['author'] });
  }

  async updatePost(post: Post): Promise<Post> {
    return this.genericPostRepository.save(post);
  }

  async remove(post: Post): Promise<void> {
    await this.genericPostRepository.remove(post);
  }
}
