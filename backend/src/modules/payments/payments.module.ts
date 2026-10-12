import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MpesaCallbackController, PaymentsController } from './payments.controller';

@Module({
  providers: [PaymentsService],
  controllers: [PaymentsController, MpesaCallbackController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
