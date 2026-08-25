import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { SubscriptionPayment } from './entities/subscription-payment.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessMember } from '../businesses/entities/business-member.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([SubscriptionPayment, Business, BusinessMember]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
