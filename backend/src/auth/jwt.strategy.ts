import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/modules/user/user.service'; // Assuming UserService can find user by sub (id)

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!, // Assert existence
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findById(payload.sub); // payload.sub is user ID
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
