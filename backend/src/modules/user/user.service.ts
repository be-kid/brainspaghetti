import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'; // Import NotFoundException
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; // Import LoginUserDto
import { UserRepository } from './user.repository';
import { AiService } from '../../ai/ai.service';
import { PostRepository } from '../post/post.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService, // Inject JwtService
    private readonly aiService: AiService,
    private readonly postRepository: PostRepository,
  ) {}

  async signup(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await this.userRepository.createUser(
      createUserDto,
      password_hash,
    );

    return newUser;
  }

  async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string }> {
    const { email, password } = loginUserDto;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    await this.userRepository.deleteUser(id);
  }

  async generateIntroduction(
    userId: number,
  ): Promise<{ aiIntroduction: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // 하루 1회 제한 체크
    const now = new Date();
    if (user.lastIntroductionGenerated) {
      const lastGenerated = new Date(user.lastIntroductionGenerated);
      const timeDiff = now.getTime() - lastGenerated.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);

      if (hoursDiff < 24) {
        throw new BadRequestException(
          'AI 소개글은 하루에 한 번만 생성할 수 있습니다.',
        );
      }
    }

    // 사용자의 최근 포스트 가져오기 (최대 20개)
    const posts = await this.postRepository.findByUserId(userId, 1, 20);

    if (posts.data.length < 10) {
      throw new BadRequestException(
        'AI 소개글 생성을 위해서는 최소 10개의 글이 필요합니다.',
      );
    }

    // AI로 소개글 생성
    const postsForAI = posts.data.map((post) => ({
      title: post.title,
      content: post.content,
    }));

    const aiIntroduction =
      await this.aiService.generateIntroduction(postsForAI);

    // 사용자 정보 업데이트
    await this.userRepository.updateUser(userId, {
      aiIntroduction,
      lastIntroductionGenerated: now,
    });

    return { aiIntroduction };
  }
}
