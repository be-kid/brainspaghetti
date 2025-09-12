import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { PostsRepository } from './posts.repository';
export declare class PostsService {
    private readonly postsRepository;
    constructor(postsRepository: PostsRepository);
    create(createPostDto: CreatePostDto): Promise<Post>;
}
