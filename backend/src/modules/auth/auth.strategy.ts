import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  /** Set only on sessions issued after a passed two-factor check. */
  mfa?: boolean;
  /** Present on short-lived 2FA tickets, which are never sessions. */
  purpose?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    // Two-factor sign-in is mandatory: older sessions without it must sign in again
    if (payload.purpose || payload.mfa !== true) {
      throw new UnauthorizedException({
        code: 'TWO_FACTOR_REQUIRED',
        message: 'Please sign in again with your authenticator code.',
      });
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Your session is no longer valid.',
      });
    }
    return { id: user.id, email: user.email, fullName: user.full_name };
  }
}