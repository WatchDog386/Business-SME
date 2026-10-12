import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportExportService } from './report-export.service';
import { ReportsController } from './reports.controller';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Payment } from '../sales/entities/payment.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { DailyReportService } from './daily-report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Expense, Customer, Payment, Subscription]),
  ],
  providers: [ReportsService, ReportExportService, DailyReportService],
  controllers: [ReportsController],
})
export class ReportsModule {}