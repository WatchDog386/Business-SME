import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { CallsModule } from '../calls/calls.module';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), CallsModule],
  providers: [SmsService],
  controllers: [SmsController],
  exports: [SmsService],
})
export class SmsModule {}