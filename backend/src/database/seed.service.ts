import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../modules/users/entities/user.entity';
import { Business } from '../modules/businesses/entities/business.entity';
import { BusinessMember } from '../modules/businesses/entities/business-member.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Product } from '../modules/products/entities/product.entity';
import { Customer } from '../modules/customers/entities/customer.entity';
import { Sale } from '../modules/sales/entities/sale.entity';
import { SaleItem } from '../modules/sales/entities/sale-item.entity';
import { Expense } from '../modules/expenses/entities/expense.entity';
import { UserRole } from '../common/types/auth-user.interface';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Business) private readonly bizRepo: Repository<Business>,
    @InjectRepository(BusinessMember) private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(Category) private readonly catRepo: Repository<Category>,
    @InjectRepository(Product) private readonly prodRepo: Repository<Product>,
    @InjectRepository(Customer) private readonly custRepo: Repository<Customer>,
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private readonly itemRepo: Repository<SaleItem>,
    @InjectRepository(Expense) private readonly expRepo: Repository<Expense>,
  ) {}

  async onModuleInit() {
    try {
      const targetEmail = 'korrifantes36@gmail.com';
      let user = await this.userRepo.findOne({ where: { email: targetEmail } });

      const passwordHash = await bcrypt.hash('fantes361', 10);
      if (!user) {
        user = this.userRepo.create({
          email: targetEmail,
          full_name: 'Korri Fant',
          phone: '+254712345678',
          password_hash: passwordHash,
          email_verified: true,
        });
        await this.userRepo.save(user);
        this.logger.log(`Created owner user ${targetEmail}`);
      } else {
        user.password_hash = passwordHash;
        await this.userRepo.save(user);
      }

      // Ensure user has a business membership
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

      if (!business) {
        return;
      }

      // Ensure business has sales
      const saleCount = await this.saleRepo.count({ where: { businessId: business.id } });
      if (saleCount < 3) {
        let products = await this.prodRepo.find({ where: { businessId: business.id } });
        if (products.length === 0) {
          const cat = this.catRepo.create({ businessId: business.id, name: 'General', type: 'PRODUCT' });
          await this.catRepo.save(cat);

          const p1 = this.prodRepo.create({
            businessId: business.id,
            categoryId: cat.id,
            name: 'Ugali Flour 2kg',
            sku: 'UGA-002',
            selling_price: 160,
            cost_price: 130,
            stock_quantity: 50,
            track_inventory: true,
          });
          await this.prodRepo.save(p1);
          products = [p1];
        }

        const now = new Date();
        const dailyAmounts = [18500, 24200, 31000, 19800, 28500, 22400, 25010];
        for (let i = 6; i >= 0; i--) {
          const saleDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dayTotal = dailyAmounts[6 - i];

          const sale = this.saleRepo.create({
            businessId: business.id,
            subtotal: dayTotal,
            discount: 0,
            tax: 0,
            total: dayTotal,
            payment_status: 'PAID',
            payment_method: 'M-PESA',
            idempotency_key: crypto.randomUUID(),
            created_at: saleDate,
          });
          await this.saleRepo.save(sale);

          if (products.length > 0) {
            const item = this.itemRepo.create({
              saleId: sale.id,
              productId: products[0].id,
              item_name: products[0].name,
              quantity: Math.max(1, Math.round(dayTotal / products[0].selling_price)),
              unit_price: products[0].selling_price,
              cost_price: products[0].cost_price,
              total: dayTotal,
            });
            await this.itemRepo.save(item);
          }
        }
        this.logger.log(`Seeded mock sales data for ${targetEmail}`);
      }
    } catch (err) {
      this.logger.error('Error in SeedService:', err);
    }
  }
}
