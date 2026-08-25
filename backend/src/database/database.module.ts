import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { dataSourceOptions } from './database.config';
import { SeedService } from './seed.service';
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
import { SubscriptionPayment } from '../modules/billing/entities/subscription-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => dataSourceOptions(config),
    }),
    TypeOrmModule.forFeature([
      User,
      Business,
      BusinessMember,
      Category,
      Product,
      Service,
      Customer,
      Sale,
      SaleItem,
      Expense,
      SubscriptionPayment,
    ]),
  ],
  providers: [SeedService],
})
export class DatabaseModule {}
