import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'; // Import NotFoundException, ForbiddenException
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto'; // Import UpdatePostDto
import { User } from '@/modules/user/entities/user.entity';
import { Post } from './entities/post.entity';

@Injectable()
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    return this.postRepository.createPost(createPostDto, author);
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.findAll();
  }

  async findById(id: number): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, user: User): Promise<Post> {
    const post = await this.findById(id); // Use existing findById to get the post

    if (post.author.id !== user.id) {
      throw new ForbiddenException('You are not authorized to update this post.');
    }

    // Apply partial updates
    Object.assign(post, updatePostDto);

    return this.postRepository.updatePost(post); // Use updatePost to update existing entity
  }

  async remove(id: number, user: User): Promise<void> {
    const post = await this.findById(id);

    if (post.author.id !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this post.');
    }

    await this.postRepository.remove(post); // Call remove method on repository
  }
}
