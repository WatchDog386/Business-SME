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
    const customer = this.repo.create({
      businessId,
      name: dto.name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      notes: dto.notes ?? null,
    });
    await this.repo.save(customer);
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
    Object.assign(customer, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    });
    await this.repo.save(customer);
    await this.auditService.log({
      businessId,
      userId: actorId,
      action: 'CUSTOMER_UPDATED',
      entity: 'customer',
      entityId: id,
      metadata: { ...dto },
    });
    return customer;
  }

  async remove(businessId: string, id: string, actorId: string): Promise<void> {
    const customer = await this.get(businessId, id);
    const saleCount = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('sales', 'sale')
      .where('sale.businessId = :businessId AND sale.customerId = :id', {
        businessId,
        id,
      })
      .getRawOne<{ count: string }>();

    if (Number(saleCount?.count ?? 0) > 0) {
      throw new ConflictException({
        code: 'CUSTOMER_HAS_SALES',
        message: 'This customer has sales and cannot be deleted.',
      });
    }

    await this.repo.remove(customer);
    await this.auditService.log({
      businessId,
      userId: actorId,
      action: 'CUSTOMER_DELETED',
      entity: 'customer',
      entityId: id,
    });
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