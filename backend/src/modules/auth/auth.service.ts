import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/types/auth-user.interface';
import { ChangePasswordDto } from './dto/auth.dto';
import { JwtPayload } from './auth.strategy';

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    isAdmin: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async register(data: {
    email: string;
    fullName: string;
    phone?: string;
    password: string;
  }): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_TAKEN',
        message: 'An account with this email already exists. Try logging in.',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      passwordHash,
    });

    return this.buildAuthResult(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Wrong email or password.',
      });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Wrong email or password.',
      });
    }
    return this.buildAuthResult(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Your session is no longer valid.',
      });
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      emailVerified: user.email_verified,
      isAdmin: this.isAdminEmail(user.email),
    };
  }

  async updateProfile(
    userId: string,
    dto: { fullName?: string; phone?: string; avatarUrl?: string },
  ) {
    const patch: Partial<User> = {};
    if (dto.fullName !== undefined) patch.full_name = dto.fullName;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.avatarUrl !== undefined) patch.avatar_url = dto.avatarUrl;

    const user = await this.usersService.update(userId, patch);
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      emailVerified: user.email_verified,
      isAdmin: this.isAdminEmail(user.email),
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(
      (await this.usersService.findById(userId))?.email ?? '',
    );
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Invalid session.' });
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!valid) {
      throw new BadRequestException({
        code: 'WRONG_PASSWORD',
        message: 'Your current password is incorrect.',
      });
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.update(user.id, { password_hash: passwordHash });
  }

  async forgotPassword(email: string): Promise<{ resetToken?: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Do not reveal whether an account exists.
      return {};
    }
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.usersService.setResetToken(user.id, hash, expiresAt);

    // NOTE: No SMTP provider configured yet. In development the token is
    // returned so the flow can be tested end-to-end. Production wiring to
    // Resend/email happens in the automation phase.
    return { resetToken: token };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hash = createHash('sha256').update(token).digest('hex');
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.reset_token_hash')
      .addSelect('user.reset_token_expires_at')
      .where('user.reset_token_hash = :hash', { hash })
      .getOne();
    if (!user || !user.reset_token_expires_at) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'This reset link is invalid or has expired.',
      });
    }
    if (user.reset_token_expires_at.getTime() < Date.now()) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'This reset link has expired. Request a new one.',
      });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.id, { password_hash: passwordHash });
    await this.usersService.clearResetToken(user.id);
  }

  private buildAuthResult(user: User): AuthResult {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.full_name,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        isAdmin: this.isAdminEmail(user.email),
      },
    };
  }

  private isAdminEmail(email: string): boolean {
    return this.config
      .get<string[]>('adminEmails', [])
      .includes(email.toLowerCase());
  }
}