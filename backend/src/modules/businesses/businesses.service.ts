import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../../common/types/auth-user.interface';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { Business, SUBSCRIPTION_PLANS } from './entities/business.entity';
import { BusinessMember } from './entities/business-member.entity';
import {
  AddMemberDto,
  CreateBusinessDto,
  UpdateBusinessDto,
} from './dto/business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateBusinessDto): Promise<Business> {
    return this.dataSource.transaction(async (manager) => {
      const business = manager.create(Business, {
        name: dto.name,
        business_type: dto.businessType,
        logo_url: dto.logoUrl ?? null,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        county: dto.county ?? null,
        currency: dto.currency ?? 'KES',
        timezone: dto.timezone ?? 'Africa/Nairobi',
        subscription_plan: 'FREE',
        status: 'ACTIVE',
        ownerId: userId,
      });
      await manager.save(business);

      const membership = manager.create(BusinessMember, {
        businessId: business.id,
        userId,
        role: UserRole.OWNER,
        status: 'ACTIVE',
      });
      await manager.save(membership);

      await this.auditService.log({
        businessId: business.id,
        userId,
        action: 'BUSINESS_CREATED',
        entity: 'business',
        entityId: business.id,
        metadata: { name: business.name, businessType: business.business_type },
      });

      return business;
    });
  }

  async listForUser(userId: string): Promise<Business[]> {
    const memberships = await this.memberRepo.find({
      where: { userId, status: 'ACTIVE' },
      relations: { business: true },
      order: { created_at: 'DESC' },
    });
    return memberships
      .filter((m) => m.business.status === 'ACTIVE')
      .map((m) => m.business);
  }

  async getById(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'The business could not be found.',
      });
    }
    return business;
  }

  async update(
    businessId: string,
    dto: UpdateBusinessDto,
    actor: { userId: string },
  ): Promise<Business> {
    const business = await this.getById(businessId);
    Object.assign(business, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.businessType !== undefined ? { business_type: dto.businessType } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.county !== undefined ? { county: dto.county } : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      ...(dto.logoUrl !== undefined ? { logo_url: dto.logoUrl } : {}),
    });
    await this.businessRepo.save(business);
    await this.auditService.log({
      businessId,
      userId: actor.userId,
      action: 'BUSINESS_UPDATED',
      entity: 'business',
      entityId: businessId,
      metadata: { ...dto },
    });
    return business;
  }

  async listMembers(businessId: string) {
    const members = await this.memberRepo.find({
      where: { businessId },
      relations: { user: true },
      order: { created_at: 'ASC' },
    });
    return members.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      createdAt: m.created_at,
      user: {
        id: m.user.id,
        fullName: m.user.full_name,
        email: m.user.email,
        phone: m.user.phone,
      },
    }));
  }

  async addMember(
    businessId: string,
    dto: AddMemberDto,
    actor: { userId: string },
  ) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message:
          'No account exists for this email. Ask them to sign up first, then invite them again.',
      });
    }

    const existing = await this.memberRepo.findOne({
      where: { businessId, userId: user.id },
    });
    if (existing) {
      if (existing.status === 'DEACTIVATED') {
        existing.status = 'ACTIVE';
        existing.role = dto.role;
        await this.memberRepo.save(existing);
      } else {
        throw new ConflictException({
          code: 'ALREADY_MEMBER',
          message: 'This user is already a member of the business.',
        });
      }
    } else {
      const member = this.memberRepo.create({
        businessId,
        userId: user.id,
        role: dto.role,
        status: 'ACTIVE',
      });
      await this.memberRepo.save(member);
    }

    await this.auditService.log({
      businessId,
      userId: actor.userId,
      action: 'MEMBER_ADDED',
      entity: 'business_member',
      entityId: user.id,
      metadata: { email: dto.email, role: dto.role },
    });

    return { email: dto.email, role: dto.role };
  }

  async updateMemberRole(
    businessId: string,
    memberId: string,
    role: UserRole,
    actor: { userId: string },
  ) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, businessId },
    });
    if (!member) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found.',
      });
    }
    if (member.role === UserRole.OWNER) {
      throw new BadRequestException({
        code: 'CANNOT_CHANGE_OWNER',
        message: 'The business owner role cannot be changed.',
      });
    }
    member.role = role;
    await this.memberRepo.save(member);
    await this.auditService.log({
      businessId,
      userId: actor.userId,
      action: 'MEMBER_ROLE_CHANGED',
      entity: 'business_member',
      entityId: member.id,
      metadata: { role },
    });
    return { id: member.id, role: member.role };
  }

  async removeMember(
    businessId: string,
    memberId: string,
    actor: { userId: string },
  ) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, businessId },
    });
    if (!member) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found.',
      });
    }
    if (member.role === UserRole.OWNER) {
      throw new BadRequestException({
        code: 'CANNOT_REMOVE_OWNER',
        message: 'The business owner cannot be removed.',
      });
    }
    await this.memberRepo.remove(member);
    await this.auditService.log({
      businessId,
      userId: actor.userId,
      action: 'MEMBER_REMOVED',
      entity: 'business_member',
      entityId: member.id,
    });
    return { success: true };
  }

  planName(plan: string): string {
    return SUBSCRIPTION_PLANS.includes(plan as never) ? plan : 'FREE';
  }
}