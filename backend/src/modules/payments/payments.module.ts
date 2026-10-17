import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { MpesaWebhookService } from './mpesa-webhook.service';
import { MpesaCallbackController, MpesaWebhookController, PaymentsController } from './payments.controller';
import { SalesModule } from '../sales/sales.module';
import { Business } from '../businesses/entities/business.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Customer]), SalesModule],
  providers: [PaymentsService, MpesaWebhookService],
  controllers: [PaymentsController, MpesaCallbackController, MpesaWebhookController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
