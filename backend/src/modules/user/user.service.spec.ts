import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto/login-user.dto';

// Mock dependencies
const mockUserRepository = {
  findByEmail: jest.fn(),
  createUser: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

// Mock bcrypt functions
jest.mock('bcrypt', () => ({
  ...jest.requireActual('bcrypt'), // import and retain default behavior
  compare: jest.fn(), // mock compare
}));

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const createUserDto: CreateUserDto = { email: 'test@test.com', password: 'password' };

    it('should successfully create a user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const mockUser = new User();
      mockUserRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.signup(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(mockUserRepository.createUser).toHaveBeenCalled();
    });

    it('should throw a ConflictException if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(new User());

      await expect(service.signup(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginUserDto: LoginUserDto = { email: 'test@test.com', password: 'password' };
    const mockUser = new User();
    mockUser.id = 1;
    mockUser.email = loginUserDto.email;
    mockUser.password_hash = 'hashed_password';

    it('should return an access token on successful login', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const accessToken = 'test_token';
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginUserDto);

      expect(result).toEqual({ accessToken });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginUserDto.password, mockUser.password_hash);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ email: mockUser.email, sub: mockUser.id });
    });

    it('should throw an UnauthorizedException for a non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an UnauthorizedException for an incorrect password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
