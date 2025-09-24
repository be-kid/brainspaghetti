import { Controller, Post, Body, UseGuards, Req, Get, Param, ParseIntPipe, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common'; // Add Delete, HttpCode, HttpStatus
import { AuthGuard } from '@nestjs/passport'; // Import AuthGuard
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto'; // Import UpdatePostDto
import { Request } from 'express'; // Import Request from express
import { User } from '@/modules/user/entities/user.entity'; // Import User entity

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('/')
  async create(@Body() createPostDto: CreatePostDto, @Req() req: Request) {
    const user = req.user as User; // Get authenticated user from request
    return this.postService.create(createPostDto, user);
  }

  @Get('/map')
  getPostsMap() {
    return this.postService.getPostsMap();
  }

  @Get('/')
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as User; // Get authenticated user from request
    return this.postService.update(id, updatePostDto, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
    const user = req.user as User;
    await this.postService.remove(id, user);
  }
}
