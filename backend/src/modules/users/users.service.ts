import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .addSelect('user.reset_token_hash')
      .addSelect('user.reset_token_expires_at')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: {
    email: string;
    phone?: string | null;
    fullName: string;
    passwordHash: string;
  }): Promise<User> {
    const user = this.repo.create({
      email: data.email.toLowerCase(),
      phone: data.phone ?? null,
      full_name: data.fullName,
      password_hash: data.passwordHash,
    });
    return this.repo.save(user);
  }

  async update(id: string, patch: Partial<User>): Promise<User> {
    await this.repo.update(id, patch);
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
      });
    }
    return user;
  }

  async setResetToken(id: string, hash: string, expiresAt: Date): Promise<void> {
    await this.repo.update(id, {
      reset_token_hash: hash,
      reset_token_expires_at: expiresAt,
    });
  }

  async clearResetToken(id: string): Promise<void> {
    await this.repo.update(id, {
      reset_token_hash: null,
      reset_token_expires_at: null,
    });
  }
}