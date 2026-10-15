import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesModule } from './modules/sales/sales.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { RecurringExpensesModule } from './modules/recurring-expenses/recurring-expenses.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { CallsModule } from './modules/calls/calls.module';
import { SmsModule } from './modules/sms/sms.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ClientPortalModule } from './modules/client-portal/client-portal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['backend/.env', '.env'],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    CommonModule,
    AuditModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    CategoriesModule,
    CustomersModule,
    ProductsModule,
    SalesModule,
    ExpensesModule,
    BudgetsModule,
    RecurringExpensesModule,
    SubscriptionsModule,
    CallsModule,
  SmsModule,
    DocumentsModule,
    PaymentsModule,
    ClientPortalModule,
    DashboardModule,
    ReportsModule,
  ],
})
export class AppModule {}