import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessMember } from '../../modules/businesses/entities/business-member.entity';
import { Business } from '../../modules/businesses/entities/business.entity';
import { RequestWithUser } from '../types/auth-user.interface';

/**
 * Resolves the active business for the authenticated user from the
 * X-Business-Id header and verifies server-side that the user is an active
 * member of that business. The verified membership is attached to the request;
 * controllers must always use request.business / request.membership and never
 * trust a raw business_id from the client.
 */
@Injectable()
export class BusinessGuard implements CanActivate {
  constructor(
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'You must be logged in.',
      });
    }

    const header = request.headers['x-business-id'];
    const businessId =
      typeof header === 'string' ? header : (header as string[])?.[0];

    if (!businessId) {
      throw new BadRequestException({
        code: 'MISSING_BUSINESS',
        message: 'Select a business to continue.',
      });
    }

    const membership = await this.memberRepo.findOne({
      where: { businessId, userId: user.id, status: 'ACTIVE' },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: 'NOT_A_MEMBER',
        message: 'You do not have access to this business.',
      });
    }

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'The business could not be found.',
      });
    }

    request.membership = {
      id: membership.id,
      businessId: membership.businessId,
      role: membership.role,
    };
    request.business = {
      id: business.id,
      name: business.name,
      timezone: business.timezone,
      currency: business.currency,
    };
    return true;
  }
}