import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly genericUserRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.genericUserRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.genericUserRepository.findOne({ where: { id } });
  }

  async createUser(createUserDto: CreateUserDto, password_hash: string): Promise<User> {
    const newUser = this.genericUserRepository.create({
      email: createUserDto.email,
      password_hash,
    });
    return this.genericUserRepository.save(newUser);
  }

  async deleteUser(id: number): Promise<void> {
    await this.genericUserRepository.delete(id);
  }
}
