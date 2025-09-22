import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '@/modules/user/user.module'; // Import UserModule to use UserService

@Module({
  imports: [
    PassportModule,
    JwtModule, // JwtModule is global, so just import it
    UserModule, // Import UserModule to use UserService
  ],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule], // Export PassportModule and JwtModule for other modules
})
export class AuthModule {}
