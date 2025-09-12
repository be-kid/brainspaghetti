import { Body, Controller, Post as PostDecorator } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @PostDecorator()
  async create(@Body() createPostDto: CreatePostDto): Promise<Post> {
    return await this.postsService.create(createPostDto);
  }
}
