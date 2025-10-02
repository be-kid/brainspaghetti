import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common'; // Re-add imports
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; // Import LoginUserDto
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/signup')
  signup(@Body() createUserDto: CreateUserDto) {
    return this.userService.signup(createUserDto);
  }

  @Post('/login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // Re-add ParseIntPipe
    return this.userService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Return 204 No Content on successful deletion
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    // Re-add ParseIntPipe
    await this.userService.deleteUser(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  async getProfile(@Request() req) {
    return this.userService.findById(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/generate-introduction')
  async generateIntroduction(@Request() req) {
    return this.userService.generateIntroduction(req.user.id);
  }
}
