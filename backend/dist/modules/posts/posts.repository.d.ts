import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
export declare class PostsRepository {
    private typeOrmRepository;
    constructor(typeOrmRepository: Repository<Post>);
    create(createPostDto: CreatePostDto): Promise<Post>;
}
