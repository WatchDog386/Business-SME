import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BusinessGuard } from '../../common/guards/business.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentBusiness } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/types/auth-user.interface';
import { DateRangeQueryDto, ReportRangeQueryDto } from './dto/report.dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, BusinessGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profit-loss')
  @ApiOperation({ summary: 'Profit & loss: revenue, COGS, gross profit, expenses, net profit' })
  profitLoss(
    @CurrentBusiness() business: { id: string; timezone: string },
    @Query() query: DateRangeQueryDto,
  ) {
    return this.reportsService.profitLoss(
      business.id,
      query.from,
      query.to,
      business.timezone,
    );
  }

  @Get('daily-summary')
  @ApiOperation({ summary: 'Daily revenue, COGS, expenses and profit' })
  dailySummary(
    @CurrentBusiness() business: { id: string; timezone: string },
    @Query() query: DateRangeQueryDto,
  ) {
    return this.reportsService.dailySummary(
      business.id,
      query.from,
      query.to,
      business.timezone,
    );
  }

  @Get('products')
  @ApiOperation({ summary: 'Product & service performance' })
  products(
    @CurrentBusiness() business: { id: string },
    @Query() query: ReportRangeQueryDto,
  ) {
    return this.reportsService.productPerformance(
      business.id,
      query.from,
      query.to,
      query.limit ?? 10,
    );
  }

  @Get('customers')
  @ApiOperation({ summary: 'Customer performance by total spend' })
  customers(
    @CurrentBusiness() business: { id: string },
    @Query() query: { limit?: number },
  ) {
    return this.reportsService.customerPerformance(business.id, query.limit ?? 10);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Expense summary by category' })
  expenses(
    @CurrentBusiness() business: { id: string },
    @Query() query: DateRangeQueryDto,
  ) {
    return this.reportsService.expenseSummary(business.id, query.from, query.to);
  }

  @Get('sales/export.csv')
  @ApiOperation({ summary: 'Export sales as CSV' })
  async salesCsv(
    @CurrentBusiness() business: { id: string },
    @Query() query: DateRangeQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.salesCsv(
      business.id,
      query.from,
      query.to,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sales-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }
}