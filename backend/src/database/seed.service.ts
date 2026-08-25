import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../modules/users/entities/user.entity';
import { Business } from '../modules/businesses/entities/business.entity';
import { BusinessMember } from '../modules/businesses/entities/business-member.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Product } from '../modules/products/entities/product.entity';
import { Service } from '../modules/products/entities/service.entity';
import { Customer } from '../modules/customers/entities/customer.entity';
import { Sale } from '../modules/sales/entities/sale.entity';
import { SaleItem } from '../modules/sales/entities/sale-item.entity';
import { Expense } from '../modules/expenses/entities/expense.entity';
import { UserRole } from '../common/types/auth-user.interface';
import { todayRangeUtc } from '../common/utils/dates';

// Deterministic pseudo-random generator so mock data is stable across restarts
let seedState = 1337;
const rand = (): number => {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
};
const randInt = (min: number, max: number): number =>
  min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: Array<T>): T => arr[Math.floor(rand() * arr.length)];

interface CatalogItem {
  name: string;
  price: number;
}

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Business) private readonly bizRepo: Repository<Business>,
    @InjectRepository(BusinessMember) private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(Category) private readonly catRepo: Repository<Category>,
    @InjectRepository(Product) private readonly prodRepo: Repository<Product>,
    @InjectRepository(Service) private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private readonly custRepo: Repository<Customer>,
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private readonly itemRepo: Repository<SaleItem>,
    @InjectRepository(Expense) private readonly expRepo: Repository<Expense>,
  ) {}

  async onModuleInit() {
    try {
      // Platform admin — owns the app, has no business of their own.
      await this.ensureAccount('korrifantes36@gmail.com');
      // Demo business owner — gets a business with a full mock dataset.
      await this.ensureAccount('fanteskorri36@gmail.com', true);
    } catch (err) {
      this.logger.error('Error in SeedService:', err);
    }
  }

  private async ensureAccount(email: string, withBusiness = false) {
    const passwordHash = await bcrypt.hash('fantes361', 10);
    let user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      user = this.userRepo.create({
        email,
        full_name:
          email === 'korrifantes36@gmail.com'
            ? 'Korri (Platform Admin)'
            : 'Felix Ochieng',
        phone: '+254712345678',
        password_hash: passwordHash,
        email_verified: true,
      });
      await this.userRepo.save(user);
      this.logger.log(`Created account ${email}`);
    } else {
      user.password_hash = passwordHash;
      await this.userRepo.save(user);
    }

    if (!withBusiness) return;

    let member = await this.memberRepo.findOne({ where: { userId: user.id } });
    let business: Business | null = null;

    if (!member) {
      business = this.bizRepo.create({
        name: "Korri's Enterprise",
        business_type: 'RETAIL',
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        ownerId: user.id,
      });
      await this.bizRepo.save(business);

      member = this.memberRepo.create({
        userId: user.id,
        businessId: business.id,
        role: UserRole.OWNER,
        status: 'ACTIVE',
      });
      await this.memberRepo.save(member);
    } else {
      business = await this.bizRepo.findOne({ where: { id: member.businessId } });
    }

    if (!business) return;

    const productCount = await this.prodRepo.count({ where: { businessId: business.id } });
    const saleCount = await this.saleRepo.count({ where: { businessId: business.id } });

    const richlySeeded = productCount >= 10 && saleCount >= 20;

    if (!richlySeeded) {
      // Wipe any thin/partial mock data so we can rebuild cleanly
      await this.wipeBusinessData(business.id);

      const cats = await this.seedCategories(business.id);
      const products = await this.seedProducts(business.id, cats);
      const services = await this.seedServices(business.id, cats);
      const customers = await this.seedCustomers(business.id);
      await this.seedSales(business.id, products, services, customers);
      await this.seedExpenses(business.id, cats);

      this.logger.log(`Seeded full mock dataset for ${email}`);
    }

    // Showcase account always reports exact demo figures for today
    await this.applyDemoTodaySummary(business.id);
  }

  /**
   * Forces today's numbers for the showcase account:
   * sales 6,580 · COGS 2,450 · gross profit 4,130 · expenses 630 → net profit 3,500
   */
  private async applyDemoTodaySummary(businessId: string) {
    const { start } = todayRangeUtc('Africa/Nairobi');

    // Remove anything already recorded today so the figures are exact
    const todaysSales = await this.saleRepo.find({
      where: { businessId, created_at: MoreThanOrEqual(start) },
      select: ['id'],
    });
    if (todaysSales.length > 0) {
      await this.itemRepo.delete({ saleId: In(todaysSales.map((s) => s.id)) });
      await this.saleRepo.delete(todaysSales.map((s) => s.id));
    }
    await this.expRepo.delete({
      businessId,
      expense_date: MoreThanOrEqual(start),
    });

    const [products, services, customers] = await Promise.all([
      this.prodRepo.find({ where: { businessId } }),
      this.serviceRepo.find({ where: { businessId } }),
      this.custRepo.find({ where: { businessId } }),
    ]);
    const prod = (name: string) => products.find((p) => p.name === name);
    const svc = (name: string) => services.find((s) => s.name === name);
    const cust = (name: string | null) =>
      name ? customers.find((c) => c.name === name) ?? null : null;

    // 930 + 750 + 2,500 + 1,600 + 800 = 6,580 in sales
    const demoSales = [
      {
        time: '08:05',
        customer: 'Mary Wanjiku',
        method: 'M-PESA',
        discount: 10,
        lines: [
          { name: 'Unga Wa Ugali 2kg', type: 'PRODUCT' as const, qty: 2 },
          { name: 'Kenya Gold Tea Leaves 250g', type: 'PRODUCT' as const, qty: 1 },
          { name: 'Fresh Milk 500ml', type: 'PRODUCT' as const, qty: 2 },
          { name: 'Brown Bread 400g', type: 'PRODUCT' as const, qty: 1 },
          { name: 'Coca-Cola 500ml', type: 'PRODUCT' as const, qty: 2 },
          { name: 'Sukuma Wiki Bunch', type: 'PRODUCT' as const, qty: 2 },
        ],
      },
      {
        time: '09:40',
        customer: null,
        method: 'CASH',
        discount: 10,
        lines: [
          { name: 'Ladies Haircut', type: 'SERVICE' as const, qty: 1 },
          { name: 'Beard Trim', type: 'SERVICE' as const, qty: 1 },
          { name: 'Coca-Cola 500ml', type: 'PRODUCT' as const, qty: 1 },
        ],
      },
      {
        time: '11:25',
        customer: 'John Otieno',
        method: 'M-PESA',
        discount: 0,
        lines: [{ name: 'Phone Screen Replacement', type: 'SERVICE' as const, qty: 1 }],
      },
      {
        time: '14:10',
        customer: 'Grace Achieng',
        method: 'M-PESA',
        discount: 0,
        lines: [
          { name: 'Braiding Full Head', type: 'SERVICE' as const, qty: 1 },
          { name: 'Dasani Water 1L', type: 'PRODUCT' as const, qty: 2 },
        ],
      },
      {
        time: '17:35',
        customer: 'Peter Kamau',
        method: 'CARD',
        discount: 0,
        lines: [{ name: 'Laptop Software Install', type: 'SERVICE' as const, qty: 1 }],
      },
    ] as const;

    for (const demo of demoSales) {
      const [hours, minutes] = demo.time.split(':').map(Number);
      const createdAt = new Date();
      createdAt.setHours(hours, minutes, 0, 0);
      if (createdAt.getTime() < start.getTime()) return;

      let subtotal = 0;
      const resolvedLines = demo.lines.map((line) => {
        const product = line.type === 'PRODUCT' ? prod(line.name) : undefined;
        const service = line.type === 'SERVICE' ? svc(line.name) : undefined;
        const unitPrice = (product?.selling_price ?? service?.price ?? 0) as number;
        const unitCost =
          product?.cost_price ?? Math.round((service?.price ?? 0) * 0.3);
        const total = unitPrice * line.qty;
        subtotal += total;
        return { product, service, line, unitPrice, unitCost, total };
      });
      const total = subtotal - demo.discount;

      const sale = await this.saleRepo.save(
        this.saleRepo.create({
          businessId,
          customerId: cust(demo.customer)?.id ?? null,
          subtotal,
          discount: demo.discount,
          tax: 0,
          total,
          payment_status: 'PAID',
          payment_method: demo.method,
          idempotency_key: crypto.randomUUID(),
        }),
      );
      // @CreateDateColumn overwrites the value on insert — backdate explicitly
      await this.saleRepo.update(sale.id, { created_at: createdAt } as any);

      for (const rl of resolvedLines) {
        await this.itemRepo.save(
          this.itemRepo.create({
            saleId: sale.id,
            productId: rl.product?.id ?? null,
            serviceId: rl.service?.id ?? null,
            item_name: rl.line.name,
            quantity: rl.line.qty,
            unit_price: rl.unitPrice,
            cost_price: rl.unitCost,
            total: rl.total,
          }),
        );
      }
    }

    // Expenses of 630 today → net profit 4,130 − 630 = 3,500
    const demoExpenses = [
      { description: 'Stock purchase – distributor', amount: 450, category: 'Stock Purchase', method: 'M-PESA' },
      { description: 'Boda delivery run', amount: 180, category: 'Transport', method: 'CASH' },
    ];
    for (const def of demoExpenses) {
      const cat = await this.catRepo.findOne({
        where: { businessId, type: 'EXPENSE', name: def.category },
      });
      const date = new Date();
      date.setHours(12, 30, 0, 0);
      const expense = await this.expRepo.save(
        this.expRepo.create({
          businessId,
          categoryId: cat?.id ?? null,
          description: def.description,
          amount: def.amount,
          payment_method: def.method,
          expense_date: date,
        }),
      );
      await this.expRepo.update(expense.id, { created_at: date } as any);
    }

    this.logger.log(
      'Applied showcase today-summary — sales 6,580 / net profit 3,500',
    );
  }

  private async wipeBusinessData(businessId: string) {
    const sales = await this.saleRepo.find({ where: { businessId }, select: ['id'] });
    if (sales.length > 0) {
      await this.itemRepo.delete({ saleId: In(sales.map((s) => s.id)) });
      await this.saleRepo.delete({ businessId });
    }
    await this.expRepo.delete({ businessId });
    await this.prodRepo.delete({ businessId });
    await this.serviceRepo.delete({ businessId });
    await this.custRepo.delete({ businessId });
    await this.catRepo.delete({ businessId });
  }

  private async seedCategories(businessId: string) {
    const defs: Array<{ type: string; name: string }> = [
      { type: 'PRODUCT', name: 'Groceries' },
      { type: 'PRODUCT', name: 'Beverages' },
      { type: 'PRODUCT', name: 'Electronics' },
      { type: 'PRODUCT', name: 'Household' },
      { type: 'SERVICE', name: 'Salon & Barber' },
      { type: 'SERVICE', name: 'Repair & Tech' },
      { type: 'EXPENSE', name: 'Rent' },
      { type: 'EXPENSE', name: 'Utilities' },
      { type: 'EXPENSE', name: 'Stock Purchase' },
      { type: 'EXPENSE', name: 'Transport' },
      { type: 'EXPENSE', name: 'Salaries' },
      { type: 'EXPENSE', name: 'Marketing' },
    ];
    return this.catRepo.save(
      defs.map((d) => this.catRepo.create({ ...d, businessId })),
    );
  }

  private cat(cats: Category[], type: string, name: string): string | null {
    return cats.find((c) => c.type === type && c.name === name)?.id ?? null;
  }

  private async seedProducts(businessId: string, cats: Category[]) {
    const defs = [
      ['Unga Wa Ugali 2kg', 'Groceries', 130, 160, 48, 8],
      ['Kenya Gold Tea Leaves 250g', 'Groceries', 180, 220, 32, 6],
      ['Sukuma Wiki Bunch', 'Groceries', 10, 15, 100, 25],
      ['Fresh Milk 500ml', 'Groceries', 55, 70, 60, 12],
      ['Brown Bread 400g', 'Groceries', 90, 110, 4, 8],
      ['Cooking Oil Salad 1L', 'Groceries', 280, 350, 24, 5],
      ['Geisha Tuna 185g', 'Groceries', 130, 170, 30, 6],
      ['Blue Band 500g', 'Groceries', 320, 380, 18, 4],
      ['Coca-Cola 500ml', 'Beverages', 45, 60, 120, 24],
      ['Dasani Water 1L', 'Beverages', 25, 50, 80, 24],
      ['Safari Lager 500ml', 'Beverages', 180, 250, 36, 6],
      ['Kenya Cane 750ml', 'Beverages', 350, 480, 12, 4],
      ['Samsung Charger Type-C', 'Electronics', 350, 600, 15, 4],
      ['Oraimo Earbuds FreePods', 'Electronics', 900, 1500, 8, 10],
      ['Torch LED Rechargeable', 'Electronics', 400, 650, 3, 5],
      ['Royco Beef Cubes 50pc', 'Household', 200, 260, 40, 8],
      ['Omo Detergent 1kg', 'Household', 210, 270, 26, 5],
      ['Colgate Toothpaste 130g', 'Household', 120, 160, 2, 6],
    ] as const;

    const products: Product[] = [];
    for (const [name, category, cost, sell, stock, threshold] of defs) {
      products.push(
        this.prodRepo.create({
          businessId,
          categoryId: this.cat(cats, 'PRODUCT', category),
          name,
          sku: name
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .split(' ')
            .map((w) => w.slice(0, 3).toUpperCase())
            .join('-')
            .slice(0, 20),
          cost_price: cost as number,
          selling_price: sell as number,
          stock_quantity: stock as number,
          low_stock_threshold: threshold as number,
          track_inventory: true,
          active: true,
        }),
      );
    }
    return this.prodRepo.save(products);
  }

  private async seedServices(businessId: string, cats: Category[]) {
    const defs = [
      ['Ladies Haircut', 'Salon & Barber', 500, 45],
      ['Braiding Full Head', 'Salon & Barber', 1500, 180],
      ['Manicure & Pedicure', 'Salon & Barber', 800, 90],
      ['Beard Trim', 'Salon & Barber', 200, 20],
      ['Phone Screen Replacement', 'Repair & Tech', 2500, 60],
      ['Laptop Software Install', 'Repair & Tech', 800, 45],
      ['Shoe Repair', 'Repair & Tech', 300, 30],
    ] as const;

    return this.serviceRepo.save(
      defs.map(([name, category, price, duration]) =>
        this.serviceRepo.create({
          businessId,
          categoryId: this.cat(cats, 'SERVICE', category),
          name,
          description: `${name} — professional service at Korri's Enterprise`,
          price: price as number,
          duration_minutes: duration as number,
          active: true,
        }),
      ),
    );
  }

  private async seedCustomers(businessId: string) {
    const defs = [
      ['Mary Wanjiku', '+254722134567', 12400, 0, 14],
      ['John Otieno', '+254733456789', 18600, 2500, 9],
      ['Grace Achieng', '+254711998877', 7300, 1200, 7],
      ['Peter Kamau', '+254720555123', 21300, 0, 21],
      ['Fatuma Hassan', '+254745666789', 4100, 0, 5],
      ['Brian Kimani', '+254798111222', 15200, 4500, 11],
      ['Njeri Mwangi', '+254701234098', 2900, 0, 3],
      ['Dennis Ochieng', '+254726888999', 8800, 0, 8],
      ['Halima Yusuf', '+254759777888', 5600, 0, 6],
      ['Samuel Kiprop', '+254710333444', 3400, 800, 4],
    ] as const;

    const now = Date.now();
    return this.custRepo.save(
      defs.map(([name, phone, spent, owed, visits], i) =>
        this.custRepo.create({
          businessId,
          name,
          phone,
          email: null,
          address: i % 2 === 0 ? 'Nairobi' : null,
          notes: null,
          total_spent: spent as number,
          outstanding_balance: owed as number,
          visit_count: visits as number,
          last_visit_at: new Date(now - randInt(0, 6) * 86400000),
        }),
      ),
    );
  }

  private async seedSales(
    businessId: string,
    products: Product[],
    services: Service[],
    customers: Customer[],
  ) {
    const now = new Date();
    const DAYS = 35;

    for (let dayOffset = DAYS; dayOffset >= 0; dayOffset--) {
      const dayDate = new Date(now.getTime() - dayOffset * 86400000);
      const weekday = dayDate.getDay(); // 0 Sun … 6 Sat
      const isWeekend = weekday === 0 || weekday === 6;
      const salesToday = dayOffset === 0 ? randInt(3, 4) : randInt(2, isWeekend ? 4 : 3);

      for (let s = 0; s < salesToday; s++) {
        const createdAt = new Date(dayDate);
        createdAt.setHours(randInt(8, 19), randInt(0, 59), randInt(0, 59), 0);

        const useCustomer = rand() < 0.55;
        const customer = useCustomer ? pick(customers) : null;
        const methodRoll = rand();
        const payment_method =
          methodRoll < 0.62 ? 'M-PESA' : methodRoll < 0.88 ? 'CASH' : methodRoll < 0.94 ? 'CARD' : 'CREDIT';

        const lineCount = randInt(1, 3);
        const chosen = new Set<string>();
        const lines: Array<{ item: CatalogItem; qty: number }> = [];
        for (let l = 0; l < lineCount; l++) {
          const useService = !useCustomer || rand() < 0.15 ? rand() < 0.2 : rand() < 0.08;
          const pool: Array<CatalogItem> = useService
            ? services.map((sv) => ({ name: sv.name, price: sv.price }))
            : products.map((p) => ({ name: p.name, price: p.selling_price }));
          const item = pick(pool);
          if (chosen.has(item.name)) continue;
          chosen.add(item.name);
          lines.push({ item, qty: randInt(1, 4) });
        }
        if (lines.length === 0) continue;

        const subtotal = lines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
        const discount = rand() < 0.08 ? Math.round(subtotal * 0.05) : 0;
        const total = subtotal - discount;
        const payment_status =
          payment_method === 'CREDIT' ? (rand() < 0.5 ? 'PARTIAL' : 'UNPAID') : 'PAID';

        const sale = await this.saleRepo.save(
          this.saleRepo.create({
            businessId,
            customerId: customer?.id ?? null,
            subtotal,
            discount,
            tax: 0,
            total,
            payment_status,
            payment_method,
            idempotency_key: crypto.randomUUID(),
          }),
        );
        // @CreateDateColumn overwrites the value on insert — backdate explicitly
        await this.saleRepo.update(sale.id, { created_at: createdAt } as any);

        for (const line of lines) {
          const product = products.find((p) => p.name === line.item.name);
          const service = services.find((sv) => sv.name === line.item.name);
          await this.itemRepo.save(
            this.itemRepo.create({
              saleId: sale.id,
              productId: product?.id ?? null,
              serviceId: service?.id ?? null,
              item_name: line.item.name,
              quantity: line.qty,
              unit_price: line.item.price,
              cost_price: product?.cost_price ?? Math.round(line.item.price * 0.65),
              total: line.item.price * line.qty,
            }),
          );
        }
      }
    }
    this.logger.log(`Mock sales generated`);
  }

  private async seedExpenses(businessId: string, cats: Category[]) {
    const now = new Date();

    const fixedDefs = [
      ['Monthly shop rent – Eastleigh', 25000, 'Rent', 'BANK', 32],
      ['Shop assistant salary – Amina', 12000, 'Salaries', 'M-PESA', 30],
      ['KPLC electricity bill', 3200, 'Utilities', 'M-PESA', 21],
      ['Nairobi Water bill', 850, 'Utilities', 'M-PESA', 18],
      ['Stock purchase – distributor', 14500, 'Stock Purchase', 'M-PESA', 15],
      ['Internet (Faiba 30Mbps)', 3500, 'Utilities', 'M-PESA', 12],
      ['Restock beverages – Coca-Cola depo', 6800, 'Stock Purchase', 'M-PESA', 9],
      ['Social media boost – Instagram', 1500, 'Marketing', 'CARD', 7],
      ['Shop signage refresh', 4200, 'Marketing', 'CASH', 5],
      ['Restock household goods', 5300, 'Stock Purchase', 'CASH', 4],
      ['KPLC prepaid tokens', 1800, 'Utilities', 'M-PESA', 3],
      ['Salary advance – Amina', 3000, 'Salaries', 'M-PESA', 2],
    ];

    const variableDefs = [
      ['Boda delivery run', 350, 'Transport'],
      ['Boda delivery run', 300, 'Transport'],
      ['Matatu fare – restock trip', 200, 'Transport'],
      ['Airtime for shop line', 500, 'Utilities'],
      ['M-Pesa transaction charges', 150, 'Utilities'],
      ['Packaging bags roll', 600, 'Stock Purchase'],
      ['Boda delivery run', 400, 'Transport'],
    ];

    const expenses: Expense[] = [];

    for (const [description, amount, category, method, daysAgo] of fixedDefs) {
      const date = new Date(now.getTime() - (daysAgo as number) * 86400000);
      expenses.push(
        this.expRepo.create({
          businessId,
          categoryId: this.cat(cats, 'EXPENSE', category as string),
          description: description as string,
          amount: amount as number,
          payment_method: method as string,
          expense_date: date,
          created_at: date,
        }),
      );
    }

    for (let d = 0; d <= 34; d++) {
      if (rand() < 0.55) {
        const def = pick(variableDefs) as [string, number, string];
        const date = new Date(now.getTime() - d * 86400000);
        expenses.push(
          this.expRepo.create({
            businessId,
            categoryId: this.cat(cats, 'EXPENSE', def[2]),
            description: def[0],
            amount: def[1] + randInt(-50, 100),
            payment_method: pick(['CASH', 'M-PESA']),
            expense_date: date,
            created_at: date,
          }),
        );
      }
    }

    await this.expRepo.save(expenses);
    // @CreateDateColumn overwrites on insert — backdate created_at to match expense_date
    for (const expense of expenses) {
      if (expense.expense_date && expense.id) {
        await this.expRepo.update(expense.id, {
          created_at: expense.expense_date,
        } as any);
      }
    }
  }
}
