import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

/** Maps the subscriber fields that were sent onto entity columns. */
function subscriberColumns(dto: UpdateCustomerDto): Partial<Customer> {
  const out: Partial<Customer> = {};
  const text = (v: string | undefined) => (v === undefined ? undefined : v.trim() || null);
  if (dto.accountNumber !== undefined) out.account_number = text(dto.accountNumber);
  if (dto.username !== undefined) out.username = text(dto.username);
  if (dto.extraPhones !== undefined) out.extra_phones = dto.extraPhones.map((p) => p.trim()).filter(Boolean);
  if (dto.kraPin !== undefined) out.kra_pin = text(dto.kraPin)?.toUpperCase() ?? null;
  if (dto.location !== undefined) out.location = text(dto.location);
  if (dto.smsGroup !== undefined) out.sms_group = text(dto.smsGroup);
  if (dto.newInstallation !== undefined) out.new_installation = dto.newInstallation;
  if (dto.discount !== undefined) out.discount = dto.discount;
  if (dto.walletBalance !== undefined) out.wallet_balance = dto.walletBalance;
  if (dto.serviceType !== undefined) out.service_type = dto.serviceType;
  if (dto.router !== undefined) out.router = text(dto.router);
  if (dto.macAddress !== undefined) out.mac_address = text(dto.macAddress)?.toUpperCase().replace(/-/g, ':') ?? null;
  // Blank means "keep the current password"
  if (dto.servicePassword) out.service_password = dto.servicePassword;
  if (dto.burstProductId !== undefined) out.burst_product_id = dto.burstProductId;
  if (dto.accessHours !== undefined) out.access_hours = dto.accessHours;
  return out;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
    private readonly auditService: AuditService,
  ) {}

  async list(
    businessId: string,
    query: { page?: number; limit?: number; search?: string },
  ): Promise<PaginatedResult<Customer>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('customer')
      .where('customer.businessId = :businessId', { businessId });

    if (query.search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('customer.name LIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('customer.phone LIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('customer.email LIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('customer.account_number LIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('customer.username LIKE :search', {
              search: `%${query.search}%`,
            });
        }),
      );
    }

    const [items, total] = await qb
      .orderBy('customer.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async get(businessId: string, id: string): Promise<Customer> {
    const customer = await this.repo.findOne({
      where: { id, businessId },
    });
    if (!customer) {
      throw new NotFoundException({
        code: 'CUSTOMER_NOT_FOUND',
        message: 'Customer could not be found.',
      });
    }
    return customer;
  }

  async create(
    businessId: string,
    dto: CreateCustomerDto,
    actorId: string,
  ): Promise<Customer> {
    const accountNumber = dto.accountNumber?.trim() || (await this.nextAccountNumber(businessId));
    const username = dto.username?.trim() || accountNumber;
    await this.assertAccountFree(businessId, accountNumber);
    await this.assertUsernameFree(businessId, username);
    const customer = this.repo.create({
      businessId,
      name: dto.name,
      phone: dto.phone ?? null,
      email: dto.email || null,
      address: dto.address ?? null,
      notes: dto.notes ?? null,
      ...subscriberColumns(dto),
      account_number: accountNumber,
      username,
      new_installation: dto.newInstallation ?? false,
    });
    await this.repo.save(customer);
    delete (customer as Partial<Customer>).service_password;
    await this.auditService.log({
      businessId,
      userId: actorId,
      action: 'CUSTOMER_CREATED',
      entity: 'customer',
      entityId: customer.id,
      metadata: { name: customer.name, phone: customer.phone },
    });
    return customer;
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdateCustomerDto,
    actorId: string,
  ): Promise<Customer> {
    const customer = await this.get(businessId, id);
    if (dto.accountNumber !== undefined && dto.accountNumber.trim() !== customer.account_number) {
      await this.assertAccountFree(businessId, dto.accountNumber.trim(), id);
    }
    // The username is how a subscriber signs in, so it has to stay unique
    if (dto.username !== undefined && dto.username.trim() !== customer.username) {
      await this.assertUsernameFree(businessId, dto.username.trim(), id);
    }
    Object.assign(customer, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.email !== undefined ? { email: dto.email || null } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...subscriberColumns(dto),
    });
    await this.repo.save(customer);
    delete (customer as Partial<Customer>).service_password;
    await this.auditService.log({
      businessId,
      userId: actorId,
      action: 'CUSTOMER_UPDATED',
      entity: 'customer',
      entityId: id,
      metadata: { ...dto, servicePassword: dto.servicePassword ? '(changed)' : undefined },
    });
    return customer;
  }

  /**
   * Removes a subscriber (owner/manager): their package, calls and app login
   * go too. Past sales stay in the books, just no longer linked to them.
   */
  async remove(businessId: string, id: string, actorId: string): Promise<void> {
    const customer = await this.get(businessId, id);
    await this.repo.manager.transaction(async (em) => {
      const where = '"businessId" = :businessId AND "customerId" = :id';
      await em.createQueryBuilder().update('sales').set({ customerId: null }).where(where, { businessId, id }).execute();
      await em.createQueryBuilder().delete().from('subscriptions').where(where, { businessId, id }).execute();
      await em.createQueryBuilder().delete().from('call_logs').where(where, { businessId, id }).execute();
      // Their client app login: the membership, and the user if it only existed for this subscriber
      const logins = await em
        .createQueryBuilder()
        .select('m.id', 'memberId')
        .addSelect('m."userId"', 'userId')
        .from('business_members', 'm')
        .where('m."businessId" = :businessId AND m."customerId" = :id', { businessId, id })
        .getRawMany<{ memberId: string; userId: string }>();
      for (const { memberId, userId } of logins) {
        await em.createQueryBuilder().delete().from('business_members').where('id = :memberId', { memberId }).execute();
        const others = await em
          .createQueryBuilder()
          .select('COUNT(*)', 'n')
          .from('business_members', 'm')
          .where('m."userId" = :userId', { userId })
          .getRawOne<{ n: string }>();
        if (Number(others?.n ?? 0) === 0) {
          await em.createQueryBuilder().delete().from('audit_logs').where('"userId" = :userId', { userId }).execute();
          await em.createQueryBuilder().delete().from('users').where('id = :userId', { userId }).execute();
        }
      }
      await em.remove(customer);
    });
    await this.auditService.log({
      businessId,
      userId: actorId,
      action: 'CUSTOMER_DELETED',
      entity: 'customer',
      entityId: id,
      metadata: { name: customer.name, accountNumber: customer.account_number },
    });
  }

  /** Next free numeric account number: one above the highest so far, starting at 1001. */
  async nextAccountNumber(businessId: string): Promise<string> {
    const row = await this.repo
      .createQueryBuilder('c')
      .select(`MAX(CAST(c.account_number AS INTEGER))`, 'max')
      .where('c.businessId = :businessId', { businessId })
      .andWhere(`c.account_number ~ '^[0-9]{1,9}$'`)
      .getRawOne<{ max: number | null }>();
    return String(Math.max(Number(row?.max ?? 0) + 1, 1001));
  }

  /** Known locations, SMS groups and routers, for the subscriber form's pickers. */
  async options(businessId: string) {
    const distinct = async (column: 'location' | 'sms_group' | 'router') =>
      (
        await this.repo
          .createQueryBuilder('c')
          .select(`DISTINCT c.${column}`, 'v')
          .where('c.businessId = :businessId', { businessId })
          .andWhere(`c.${column} IS NOT NULL AND c.${column} <> ''`)
          .orderBy('v', 'ASC')
          .getRawMany<{ v: string }>()
      ).map((r) => r.v);
    const [locations, smsGroups, routers, nextAccountNumber] = await Promise.all([
      distinct('location'),
      distinct('sms_group'),
      distinct('router'),
      this.nextAccountNumber(businessId),
    ]);
    return { locations, smsGroups, routers, nextAccountNumber };
  }

  private async assertAccountFree(businessId: string, accountNumber: string, exceptId?: string) {
    const taken = await this.repo.findOne({ where: { businessId, account_number: accountNumber } });
    if (taken && taken.id !== exceptId) {
      throw new ConflictException({
        code: 'ACCOUNT_NUMBER_TAKEN',
        message: `Account number ${accountNumber} already belongs to ${taken.name}.`,
      });
    }
  }

  /**
   * Usernames are how subscribers sign in, so two subscribers in the same
   * business may never share one. Compared without regard to case, because
   * sign-in is.
   */
  private async assertUsernameFree(businessId: string, username: string, exceptId?: string) {
    if (!username) return;
    const taken = await this.repo
      .createQueryBuilder('c')
      .where('c.businessId = :businessId', { businessId })
      .andWhere('LOWER(c.username) = LOWER(:username)', { username })
      .getOne();
    if (taken && taken.id !== exceptId) {
      throw new ConflictException({
        code: 'USERNAME_TAKEN',
        message: `Username ${username} is already used by ${taken.name}. Pick another one.`,
      });
    }
  }

  /** Adjust customer totals after a sale or refund. `delta` is signed. */
  async adjustSpend(
    businessId: string,
    customerId: string,
    delta: number,
    balanceDelta: number,
    isVisit: boolean,
  ): Promise<void> {
    if (!customerId) return;
    const customer = await this.repo.findOne({
      where: { id: customerId, businessId },
    });
    if (!customer) return;
    customer.total_spent = Math.max(0, customer.total_spent + delta);
    customer.outstanding_balance = Math.max(
      0,
      customer.outstanding_balance + balanceDelta,
    );
    if (isVisit) {
      customer.visit_count = customer.visit_count + 1;
      customer.last_visit_at = new Date();
    }
    await this.repo.save(customer);
  }
}