import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { SalesService } from '../sales/sales.service';
import { ExpensesService } from '../expenses/expenses.service';
import { todayRangeUtc, lastNDaysRangeUtc } from '../../common/utils/dates';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly itemRepo: Repository<SaleItem>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly salesService: SalesService,
    private readonly expensesService: ExpensesService,
  ) {}

  async getDashboard(businessId: string, timezone: string) {
    const today = todayRangeUtc(timezone);
    const week = lastNDaysRangeUtc(7, timezone);
    const month = lastNDaysRangeUtc(30, timezone);

    const [todaySales, todayCogs, todayExpenses, outstandingDebts, lowStock, recentCustomers, salesSeries] =
      await Promise.all([
        this.sumSales(businessId, today.start, today.end),
        this.sumCogs(businessId, today.start, today.end),
        this.expensesService.totalInRange(businessId, today.start, today.end),
        this.sumOutstandingDebts(businessId),
        this.lowStockCount(businessId),
        this.recentDebtors(businessId, 5),
        this.dailySalesSeries(businessId, week.start, week.end),
      ]);

    const grossProfit = todaySales - todayCogs;
    const netProfit = grossProfit - todayExpenses;

    const [recentTransactions, monthRevenue, topProducts, salesCount] =
      await Promise.all([
        this.recentTransactions(businessId, 10),
        this.sumSales(businessId, month.start, month.end),
        this.topProducts(businessId, month.start, month.end, 5),
        this.countSales(businessId, today.start, today.end),
      ]);

    return {
      today: {
        sales: todaySales,
        expenses: todayExpenses,
        grossProfit,
        netProfit,
        salesCount,
      },
      weekRevenue: await this.sumSales(businessId, week.start, week.end),
      monthRevenue,
      outstandingDebts,
      lowStock,
      appointmentsToday: 0,
      recentCustomers,
      recentTransactions,
      topProducts,
      salesSeries,
    };
  }

  private async sumSales(businessId: string, from: Date, to: Date): Promise<number> {
    const row = await this.saleRepo
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.total), 0)', 'sum')
      .where('sale.businessId = :businessId', { businessId })
      .andWhere("sale.payment_status != 'CANCELLED'")
      .andWhere('sale.created_at >= :from', { from })
      .andWhere('sale.created_at < :to', { to })
      .getRawOne<{ sum: string }>();
    return Number(row?.sum ?? 0);
  }

  private async sumCogs(businessId: string, from: Date, to: Date): Promise<number> {
    const row = await this.itemRepo
      .createQueryBuilder('item')
      .innerJoin('sales', 'sale', 'sale.id = item.saleId')
      .select(
        'COALESCE(SUM(item.cost_price * item.quantity), 0)',
        'sum',
      )
      .where('sale.businessId = :businessId', { businessId })
      .andWhere("sale.payment_status != 'CANCELLED'")
      .andWhere('sale.created_at >= :from', { from })
      .andWhere('sale.created_at < :to', { to })
      .getRawOne<{ sum: string }>();
    return Number(row?.sum ?? 0);
  }

  private async sumOutstandingDebts(businessId: string): Promise<number> {
    const row = await this.customerRepo
      .createQueryBuilder('customer')
      .select('COALESCE(SUM(customer.outstanding_balance), 0)', 'sum')
      .where('customer.businessId = :businessId', { businessId })
      .getRawOne<{ sum: string }>();
    return Number(row?.sum ?? 0);
  }

  private async lowStockCount(businessId: string): Promise<number> {
    const row = await this.productRepo
      .createQueryBuilder('product')
      .select('COUNT(*)', 'count')
      .where('product.businessId = :businessId', { businessId })
      .andWhere('product.track_inventory = :track', { track: true })
      .andWhere('product.active = :active', { active: true })
      .andWhere('product.stock_quantity <= product.low_stock_threshold')
      .getRawOne<{ count: string }>();
    return Number(row?.count ?? 0);
  }

  private async recentDebtors(businessId: string, limit: number) {
    return this.customerRepo.find({
      where: { businessId },
      order: { outstanding_balance: 'DESC' },
      take: limit,
    });
  }

  private async dailySalesSeries(businessId: string, from: Date, to: Date) {
    const qb = this.saleRepo
      .createQueryBuilder('sale')
      .select('DATE(sale.created_at)', 'date')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'total')
      .where('sale.businessId = :businessId', { businessId })
      .andWhere("sale.payment_status != 'CANCELLED'")
      .andWhere('sale.created_at >= :from', { from })
      .andWhere('sale.created_at < :to', { to })
      .groupBy('DATE(sale.created_at)')
      .orderBy('DATE(sale.created_at)', 'ASC');
    return qb.getRawMany<{ date: string; total: string }>();
  }

  private async recentTransactions(businessId: string, limit: number) {
    const [sales, expenses] = await Promise.all([
      this.saleRepo
        .createQueryBuilder('sale')
        .leftJoin('customers', 'customer', 'customer.id = sale.customerId')
        .addSelect('customer.name', 'customer_name')
        .where('sale.businessId = :businessId', { businessId })
        .orderBy('sale.created_at', 'DESC')
        .take(limit)
        .getRawAndEntities(),
      this.expenseRepo
        .createQueryBuilder('expense')
        .where('expense.businessId = :businessId', { businessId })
        .orderBy('expense.created_at', 'DESC')
        .take(limit)
        .getMany(),
    ]);

    const transactions = [
      ...sales.entities.map((sale, idx) => ({
        type: 'SALE' as const,
        id: sale.id,
        amount: sale.total,
        paymentMethod: sale.payment_method,
        status: sale.payment_status,
        description: `Sale #${sale.id.slice(0, 8).toUpperCase()}`,
        customerName:
          (sales.raw[idx] as { customer_name?: string }).customer_name ?? 'Walk-in',
        createdAt: sale.created_at,
      })),
      ...expenses.map((expense) => ({
        type: 'EXPENSE' as const,
        id: expense.id,
        amount: expense.amount,
        paymentMethod: expense.payment_method,
        status: 'DONE',
        description: expense.description,
        customerName: null,
        createdAt: expense.created_at,
      })),
    ];

    return transactions
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  private async topProducts(businessId: string, from: Date, to: Date, limit: number) {
    return this.itemRepo
      .createQueryBuilder('item')
      .innerJoin('sales', 'sale', 'sale.id = item.saleId')
      .leftJoin('products', 'product', 'product.id = item.productId')
      .leftJoin('services', 'service', 'service.id = item.serviceId')
      .select('COALESCE(product.name, service.name, item.item_name)', 'name')
      .addSelect('SUM(item.quantity)', 'quantity')
      .addSelect('SUM(item.total)', 'revenue')
      .where('sale.businessId = :businessId', { businessId })
      .andWhere("sale.payment_status != 'CANCELLED'")
      .andWhere('sale.created_at >= :from', { from })
      .andWhere('sale.created_at < :to', { to })
      .groupBy('COALESCE(product.name, service.name, item.item_name)')
      .orderBy('SUM(item.total)', 'DESC')
      .take(limit)
      .getRawMany<{ name: string; quantity: string; revenue: string }>();
  }

  private async countSales(businessId: string, from: Date, to: Date): Promise<number> {
    const row = await this.saleRepo
      .createQueryBuilder('sale')
      .select('COUNT(*)', 'count')
      .where('sale.businessId = :businessId', { businessId })
      .andWhere("sale.payment_status != 'CANCELLED'")
      .andWhere('sale.created_at >= :from', { from })
      .andWhere('sale.created_at < :to', { to })
      .getRawOne<{ count: string }>();
    return Number(row?.count ?? 0);
  }
}