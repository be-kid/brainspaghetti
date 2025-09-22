import { Controller, Post, Body, Get, Param, ParseIntPipe, Delete, HttpCode, HttpStatus } from '@nestjs/common'; // Re-add imports
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; // Import LoginUserDto

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
  findOne(@Param('id', ParseIntPipe) id: number) { // Re-add ParseIntPipe
    return this.userService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Return 204 No Content on successful deletion
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> { // Re-add ParseIntPipe
    await this.userService.deleteUser(id);
  }
}
