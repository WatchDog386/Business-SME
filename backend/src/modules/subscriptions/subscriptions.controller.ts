import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BusinessGuard } from '../../common/guards/business.guard';
import { CurrentBusiness } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService, SubscriptionStatus } from './subscriptions.service';

class CreateSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'A WiFi package (product with billing days)' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Defaults to today' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, BusinessGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'WiFi subscribers, soonest expiry first' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'EXPIRING', 'EXPIRED'] })
  list(@CurrentBusiness() business: { id: string }, @Query('status') status?: SubscriptionStatus) {
    return this.subscriptions.list(business.id, status);
  }

  @Post()
  @ApiOperation({ summary: 'Add an existing subscriber (already connected, no sale)' })
  create(@CurrentBusiness() business: { id: string }, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptions.create(business.id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Active, expiring-soon and expired subscriber counts' })
  stats(@CurrentBusiness() business: { id: string }) {
    return this.subscriptions.stats(business.id);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: "A client's current WiFi package, if any" })
  forCustomer(
    @CurrentBusiness() business: { id: string },
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.subscriptions.forCustomer(business.id, customerId);
  }
}
