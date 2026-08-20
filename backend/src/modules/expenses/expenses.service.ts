import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { AuditService } from '../audit/audit.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
    private readonly auditService: AuditService,
  ) {}

  async list(
    businessId: string,
    query: {
      page?: number;
      limit?: number;
      from?: string;
      to?: string;
      categoryId?: string;
      search?: string;
    },
  ): Promise<PaginatedResult<Expense & { category_name: string | null }>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('expense')
      .leftJoin('categories', 'category', 'category.id = expense.categoryId')
      .addSelect('category.name', 'category_name')
      .where('expense.businessId = :businessId', { businessId });

    if (query.from) {
      qb.andWhere('expense.expense_date >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('expense.expense_date < :to', { to: query.to });
    }
    if (query.categoryId) {
      qb.andWhere('expense.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.search) {
      qb.andWhere('expense.description LIKE :search', {
        search: `%${query.search}%`,
      });
    }

    const result = await qb
      .orderBy('expense.expense_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    const total = await qb
      .clone()
      .select('COUNT(*)', 'count')
      .getRawOne<{ count: string }>();

    const items = result.entities.map((expense, idx) =>
      Object.assign(expense, {
        category_name:
          (result.raw[idx] as { category_name?: string }).category_name ?? null,
      }),
    );

    return { items, total: Number(total?.count ?? 0), page, limit };
  }

  async get(businessId: string, id: string): Promise<Expense> {
    const expense = await this.repo.findOne({ where: { id, businessId } });
    if (!expense) {
      throw new NotFoundException({
        code: 'EXPENSE_NOT_FOUND',
        message: 'Expense not found.',
      });
    }
    return expense;
  }

  async create(
    businessId: string,
    dto: CreateExpenseDto,
    actorId: string,
  ): Promise<Expense> {
    const expense = this.repo.create({
      businessId,
      description: dto.description,
      amount: Math.round(dto.amount),
      categoryId: dto.categoryId ?? null,
      payment_method: dto.paymentMethod ?? 'CASH',
      receipt_url: dto.receiptUrl ?? null,
      employeeId: dto.employeeId ?? null,
      expense_date: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
    });
    await this.repo.save(expense);
    await this.auditService.log({
      businessId,
      userId: actorId,
      action: 'EXPENSE_CREATED',
      entity: 'expense',
      entityId: expense.id,
      metadata: {
        description: expense.description,
        amount: expense.amount,
        paymentMethod: expense.payment_method,
      },
    });
    return expense;
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdateExpenseDto,
    actorId: string,
  ): Promise<Expense> {
    const expense = await this.get(businessId, id);
    const previous = { amount: expense.amount, description: expense.description };
    Object.assign(expense, {
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.amount !== undefined ? { amount: Math.round(dto.amount) } : {}),
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(dto.paymentMethod !== undefined
        ? { payment_method: dto.paymentMethod }
        : {}),
      ...(dto.receiptUrl !== undefined ? { receipt_url: dto.receiptUrl } : {}),
      ...(dto.employeeId !== undefined ? { employeeId: dto.employeeId } : {}),
      ...(dto.expenseDate !== undefined
        ? { expense_date: new Date(dto.expenseDate) }
        : {}),
    });
    await this.repo.save(expense);
    await this.auditService.log({
      businessId,
      userId: actorId,
      action: 'EXPENSE_UPDATED',
      entity: 'expense',
      entityId: id,
      metadata: { previous, current: { amount: expense.amount } },
    });
    return expense;
  }

  async remove(businessId: string, id: string, actorId: string): Promise<void> {
    const expense = await this.get(businessId, id);
    await this.repo.remove(expense);
    await this.auditService.log({
      businessId,
      userId: actorId,
      action: 'EXPENSE_DELETED',
      entity: 'expense',
      entityId: id,
      metadata: { amount: expense.amount },
    });
  }

  async totalInRange(
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const row = await this.repo
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'sum')
      .where('expense.businessId = :businessId', { businessId })
      .andWhere('expense.expense_date >= :from', { from })
      .andWhere('expense.expense_date < :to', { to })
      .getRawOne<{ sum: string }>();
    return Number(row?.sum ?? 0);
  }
}