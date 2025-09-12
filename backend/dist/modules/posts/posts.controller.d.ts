import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(createPostDto: CreatePostDto): Promise<Post>;
}
