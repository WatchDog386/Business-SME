import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment } from './entities/payment.entity';
import { CreateSaleDto, RecordPaymentDto } from './dto/sale.dto';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';
import { CustomersService } from '../customers/customers.service';
import { Product } from '../products/entities/product.entity';
import { Service } from '../products/entities/service.entity';
import { roundKES } from '../../common/utils/money';
import { PaginatedResult } from '../../common/dto/pagination.dto';

interface ResolvedItem {
  type: 'PRODUCT' | 'SERVICE';
  id: string;
  name: string;
  unitPrice: number;
  costPrice: number | null;
  quantity: number;
  total: number;
}

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly itemRepo: Repository<SaleItem>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
    private readonly customersService: CustomersService,
    private readonly dataSource: DataSource,
  ) {}

  async resolveItems(
    businessId: string,
    items: CreateSaleDto['items'],
  ): Promise<ResolvedItem[]> {
    if (items.length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_SALE',
        message: 'Add at least one product or service.',
      });
    }

    const productIds = items
      .filter((i) => i.productId)
      .map((i) => i.productId as string);
    const serviceIds = items
      .filter((i) => i.serviceId)
      .map((i) => i.serviceId as string);

    const [products, services] = await Promise.all([
      productIds.length
        ? this.productRepo.find({
            where: {
              id: In(productIds),
              businessId,
              active: true,
            },
          })
        : Promise.resolve([] as Product[]),
      serviceIds.length
        ? this.serviceRepo.find({
            where: {
              id: In(serviceIds),
              businessId,
              active: true,
            },
          })
        : Promise.resolve([] as Service[]),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const serviceMap = new Map(services.map((s) => [s.id, s]));

    return items.map((item) => {
      if (item.productId && item.serviceId) {
        throw new BadRequestException({
          code: 'INVALID_ITEM',
          message: 'Each line item must be either a product or a service, not both.',
        });
      }
      if (item.productId) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new BadRequestException({
            code: 'PRODUCT_NOT_FOUND',
            message: 'A product in this sale could not be found or is inactive.',
          });
        }
        return {
          type: 'PRODUCT' as const,
          id: product.id,
          name: product.name,
          unitPrice: product.selling_price,
          costPrice: product.cost_price,
          quantity: item.quantity,
          total: roundKES(product.selling_price * item.quantity),
        };
      }
      if (item.serviceId) {
        const service = serviceMap.get(item.serviceId);
        if (!service) {
          throw new BadRequestException({
            code: 'SERVICE_NOT_FOUND',
            message: 'A service in this sale could not be found or is inactive.',
          });
        }
        return {
          type: 'SERVICE' as const,
          id: service.id,
          name: service.name,
          unitPrice: service.price,
          costPrice: null,
          quantity: item.quantity,
          total: roundKES(service.price * item.quantity),
        };
      }
      throw new BadRequestException({
        code: 'INVALID_ITEM',
        message: 'Each line item needs a product or service.',
      });
    });
  }

  computeTotals(
    items: ResolvedItem[],
    discount: number,
    taxRate: number,
  ): { subtotal: number; discount: number; tax: number; total: number } {
    const subtotal = roundKES(items.reduce((acc, i) => acc + i.total, 0));
    const appliedDiscount = Math.min(Math.max(0, roundKES(discount ?? 0)), subtotal);
    const taxBase = subtotal - appliedDiscount;
    const tax = roundKES((taxBase * (taxRate ?? 0)) / 100);
    const total = subtotal - appliedDiscount + tax;
    return { subtotal, discount: appliedDiscount, tax, total };
  }

  private isAmountOnly(dto: CreateSaleDto): boolean {
    return (!dto.items || dto.items.length === 0) && !!dto.total;
  }

  async preview(businessId: string, dto: CreateSaleDto) {
    if (this.isAmountOnly(dto)) {
      const total = roundKES(dto.total as number);
      return {
        subtotal: total,
        discount: 0,
        tax: 0,
        total,
        items: [],
      };
    }
    const items = await this.resolveItems(businessId, dto.items);
    const totals = this.computeTotals(items, dto.discount ?? 0, dto.taxRate ?? 0);
    return {
      ...totals,
      items: items.map((i) => ({
        type: i.type,
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
    };
  }

  async create(
    businessId: string,
    dto: CreateSaleDto,
    actor: { userId: string; role: string },
  ): Promise<Sale & { items: SaleItem[]; payments: Payment[]; customer: { name: string } | null }> {
    const existing = await this.saleRepo.findOne({
      where: { businessId, idempotency_key: dto.idempotencyKey },
    });
    if (existing) {
      return this.get(businessId, existing.id);
    }

    const isAmountOnly = this.isAmountOnly(dto);
    if (!isAmountOnly && dto.items.length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_SALE',
        message: 'Add at least one product or service.',
      });
    }

    const resolved = isAmountOnly
      ? []
      : await this.resolveItems(businessId, dto.items);
    const totals = isAmountOnly
      ? {
          subtotal: roundKES(dto.total as number),
          discount: 0,
          tax: 0,
          total: roundKES(dto.total as number),
        }
      : this.computeTotals(resolved, dto.discount ?? 0, dto.taxRate ?? 0);

    if (totals.total === 0) {
      throw new BadRequestException({
        code: 'ZERO_TOTAL',
        message: 'The sale total cannot be zero.',
      });
    }

    const amountPaid = Math.min(
      roundKES(dto.amountPaid ?? totals.total),
      totals.total,
    );
    let paymentStatus: string;
    if (dto.paymentMethod === 'CREDIT') {
      paymentStatus = amountPaid <= 0 ? 'UNPAID' : 'PARTIAL';
    } else {
      paymentStatus =
        amountPaid >= totals.total ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
    }

    if (dto.customerId) {
      await this.customersService.get(businessId, dto.customerId);
    }

    const sale = await this.dataSource.transaction(async (manager) => {
      const saleEntity = manager.create(Sale, {
        businessId,
        customerId: dto.customerId ?? null,
        employeeId: dto.employeeId ?? null,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        payment_status: paymentStatus,
        payment_method: dto.paymentMethod,
        notes: dto.notes ?? null,
        idempotency_key: dto.idempotencyKey,
      });
      await manager.save(saleEntity);

      const saleItems: SaleItem[] = [];
      for (const item of resolved) {
        const saleItem = manager.create(SaleItem, {
          saleId: saleEntity.id,
          productId: item.type === 'PRODUCT' ? item.id : null,
          serviceId: item.type === 'SERVICE' ? item.id : null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          cost_price: item.costPrice,
          total: item.total,
          item_name: item.name,
        });
        saleItems.push(await manager.save(saleItem));
      }

      if (amountPaid > 0) {
        const payment = manager.create(Payment, {
          businessId,
          saleId: saleEntity.id,
          customerId: dto.customerId ?? null,
          amount: amountPaid,
          method: dto.paymentMethod,
          reference: dto.reference ?? null,
          status: 'SUCCESS',
          transaction_date: new Date(),
        });
        await manager.save(payment);
      }

      const movements = resolved
        .filter((item) => item.type === 'PRODUCT')
        .map((item) => ({
          productId: item.id,
          quantity: -item.quantity,
          type: 'SALE' as const,
          referenceId: saleEntity.id,
          reason: 'Sale deduction',
        }));
      if (movements.length) {
        await this.inventoryService.applyMovements(
          businessId,
          movements,
          actor.userId,
          manager,
        );
      }

      if (dto.customerId) {
        await this.customersService.adjustSpend(
          businessId,
          dto.customerId,
          totals.total,
          totals.total - amountPaid,
          true,
        );
      }

      await this.auditService.log({
        businessId,
        userId: actor.userId,
        action: 'SALE_CREATED',
        entity: 'sale',
        entityId: saleEntity.id,
        metadata: {
          total: saleEntity.total,
          paymentMethod: dto.paymentMethod,
          paymentStatus,
          amountPaid,
          items: resolved.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      });

      return saleEntity;
    });

    return this.get(businessId, sale.id);
  }

  async list(
    businessId: string,
    query: {
      page?: number;
      limit?: number;
      from?: string;
      to?: string;
      customerId?: string;
      paymentStatus?: string;
      search?: string;
    },
  ): Promise<PaginatedResult<Sale & { customer_name: string | null; item_count: number }>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.saleRepo
      .createQueryBuilder('sale')
      .leftJoin('customers', 'customer', 'customer.id = sale.customerId')
      .addSelect('customer.name', 'customer_name')
      .addSelect(
        '(SELECT COUNT(*) FROM sale_items si WHERE si.saleId = sale.id)',
        'item_count',
      )
      .where('sale.businessId = :businessId', { businessId });

    if (query.from) qb.andWhere('sale.created_at >= :from', { from: query.from });
    if (query.to) qb.andWhere('sale.created_at < :to', { to: query.to });
    if (query.customerId) {
      qb.andWhere('sale.customerId = :customerId', { customerId: query.customerId });
    }
    if (query.paymentStatus) {
      qb.andWhere('sale.payment_status = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }
    if (query.search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('customer.name LIKE :search', { search: `%${query.search}%` })
            .orWhere('sale.id LIKE :search', { search: `%${query.search}%` });
        }),
      );
    }

    const result = await qb
      .orderBy('sale.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    const totalRow = await qb
      .clone()
      .select('COUNT(*)', 'count')
      .getRawOne<{ count: string }>();

    const items = result.entities.map((sale, idx) =>
      Object.assign(sale, {
        customer_name:
          (result.raw[idx] as { customer_name?: string }).customer_name ?? null,
        item_count: Number(
          (result.raw[idx] as { item_count?: string }).item_count ?? 0,
        ),
      }),
    );

    return { items, total: Number(totalRow?.count ?? 0), page, limit };
  }

  async get(businessId: string, id: string) {
    const sale = await this.saleRepo.findOne({
      where: { id, businessId },
    });
    if (!sale) {
      throw new NotFoundException({
        code: 'SALE_NOT_FOUND',
        message: 'Sale not found.',
      });
    }

    const [itemResult, payments] = await Promise.all([
      this.itemRepo
        .createQueryBuilder('item')
        .leftJoin('products', 'product', 'product.id = item.productId')
        .leftJoin('services', 'service', 'service.id = item.serviceId')
        .addSelect('product.name', 'product_name')
        .addSelect('service.name', 'service_name')
        .where('item.saleId = :saleId', { saleId: id })
        .getRawAndEntities(),
      this.paymentRepo.find({
        where: { businessId, saleId: id },
        order: { created_at: 'ASC' },
      }),
    ]);

    const customer = sale.customerId
      ? await this.customersService
          .get(businessId, sale.customerId)
          .catch(() => null)
      : null;

    return Object.assign(sale, {
      customer,
      items: itemResult.entities.map((item, idx) =>
        Object.assign(item, {
          product_name:
            (itemResult.raw[idx] as { product_name?: string }).product_name ?? null,
          service_name:
            (itemResult.raw[idx] as { service_name?: string }).service_name ?? null,
        }),
      ),
      payments,
    });
  }

  async recordPayment(
    businessId: string,
    saleId: string,
    dto: RecordPaymentDto,
    actor: { userId: string },
  ) {
    const sale = await this.saleRepo.findOne({
      where: { id: saleId, businessId },
    });
    if (!sale) {
      throw new NotFoundException({
        code: 'SALE_NOT_FOUND',
        message: 'Sale not found.',
      });
    }
    if (sale.payment_status === 'CANCELLED' || sale.payment_status === 'REFUNDED') {
      throw new BadRequestException({
        code: 'SALE_CLOSED',
        message: 'This sale is closed and cannot receive payments.',
      });
    }

    const alreadyPaid = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'paid')
      .where('payment.saleId = :saleId', { saleId })
      .andWhere("payment.status != 'REFUNDED'")
      .getRawOne<{ paid: string }>();
    const paid = Number(alreadyPaid?.paid ?? 0);
    const remaining = sale.total - paid;
    const amount = roundKES(dto.amount);

    if (amount <= 0) {
      throw new BadRequestException({
        code: 'INVALID_AMOUNT',
        message: 'Enter a valid amount.',
      });
    }
    if (amount > remaining) {
      throw new BadRequestException({
        code: 'OVERPAYMENT',
        message: `This sale only has KES ${remaining.toLocaleString('en-KE')} remaining.`,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      const payment = manager.create(Payment, {
        businessId,
        saleId,
        customerId: sale.customerId,
        amount,
        method: dto.method,
        reference: dto.reference ?? null,
        status: 'SUCCESS',
        transaction_date: new Date(),
      });
      await manager.save(payment);

      const newPaid = paid + amount;
      sale.payment_status = newPaid >= sale.total ? 'PAID' : 'PARTIAL';
      await manager.save(sale);

      if (sale.customerId) {
        await this.customersService.adjustSpend(
          businessId,
          sale.customerId,
          0,
          -amount,
          false,
        );
      }
    });

    await this.auditService.log({
      businessId,
      userId: actor.userId,
      action: 'PAYMENT_RECORDED',
      entity: 'sale',
      entityId: saleId,
      metadata: { amount, method: dto.method, reference: dto.reference },
    });

    return this.get(businessId, saleId);
  }

  async cancel(
    businessId: string,
    saleId: string,
    actor: { userId: string },
  ) {
    const sale = await this.saleRepo.findOne({
      where: { id: saleId, businessId },
    });
    if (!sale) {
      throw new NotFoundException({
        code: 'SALE_NOT_FOUND',
        message: 'Sale not found.',
      });
    }
    if (sale.payment_status === 'CANCELLED') {
      return this.get(businessId, saleId);
    }

    const items = await this.itemRepo.find({ where: { saleId } });
    const alreadyPaid = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'paid')
      .where('payment.saleId = :saleId', { saleId })
      .andWhere("payment.status != 'REFUNDED'")
      .getRawOne<{ paid: string }>();
    const paid = Number(alreadyPaid?.paid ?? 0);
    const unpaidBalance = Math.max(0, sale.total - paid);

    await this.dataSource.transaction(async (manager) => {
      const movements = items
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId as string,
          quantity: item.quantity,
          type: 'RETURN' as const,
          referenceId: sale.id,
          reason: 'Sale cancelled',
        }));
      if (movements.length) {
        await this.inventoryService.applyMovements(
          businessId,
          movements,
          actor.userId,
          manager,
        );
      }

      await manager.getRepository(Payment).update(
        { saleId, status: 'SUCCESS' },
        { status: 'REFUNDED' },
      );

      sale.payment_status = 'CANCELLED';
      sale.cancelled_at = new Date();
      sale.cancelled_by = actor.userId;
      await manager.save(sale);

      if (sale.customerId) {
        await this.customersService.adjustSpend(
          businessId,
          sale.customerId,
          -sale.total,
          -unpaidBalance,
          false,
        );
      }
    });

    await this.auditService.log({
      businessId,
      userId: actor.userId,
      action: 'SALE_CANCELLED',
      entity: 'sale',
      entityId: saleId,
      metadata: { total: sale.total, paid, refunded: paid, unpaidBalance },
    });

    return this.get(businessId, saleId);
  }
}