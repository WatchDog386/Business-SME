import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SubscriptionPayment } from '../billing/entities/subscription-payment.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessMember } from '../businesses/entities/business-member.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Service } from '../products/entities/service.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Expense } from '../expenses/entities/expense.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      SubscriptionPayment,
      Business,
      BusinessMember,
      User,
      Product,
      Service,
      Customer,
      Sale,
      Expense,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
