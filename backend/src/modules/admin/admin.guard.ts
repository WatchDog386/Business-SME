import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Allows only the platform owner(s) — emails listed in the ADMIN_EMAILS
 * env var (comma separated). Attach after JwtAuthGuard.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { id: string; email: string };
    }>();
    const user = request.user;
    if (!user?.email) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'You must be logged in.',
      });
    }
    const allowed = this.config.get<string[]>('adminEmails') ?? [];
    if (!allowed.includes(user.email.toLowerCase())) {
      throw new ForbiddenException({
        code: 'NOT_ADMIN',
        message: 'This area is restricted to the app owner.',
      });
    }
    return true;
  }
}
