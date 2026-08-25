import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BusinessGuard } from '../../common/guards/business.guard';
import {
  CurrentBusiness,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { BillingService, type BillingMethod } from './billing.service';

class InitiateBillingDto {
  @IsString()
  plan: string;

  @IsIn(['MPESA', 'CARD', 'BANK', 'PAYPAL'])
  method: BillingMethod;
}

@ApiTags('billing')
@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('billing/initiate')
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a subscription payment for the active business' })
  initiate(
    @CurrentUser() user: AuthUser,
    @CurrentBusiness() business: { id: string },
    @Body() dto: InitiateBillingDto,
  ) {
    return this.billingService.initiate(
      user.id,
      user.email,
      business.id,
      dto.plan,
      dto.method,
    );
  }

  @Get('billing/verify/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a subscription payment after gateway success' })
  verify(@CurrentUser() user: AuthUser, @Param('reference') reference: string) {
    return this.billingService.verify(user.id, reference);
  }

  /**
   * Gateway webhook (Paystack). Configure https://<host>/api/v1/webhooks/paystack
   * in your Paystack dashboard; the reference is matched to the pending charge.
   */
  @Post('webhooks/paystack')
  @HttpCode(200)
  async paystackWebhook(@Body() body: { event?: string; data?: { reference?: string } }) {
    const reference = body?.data?.reference;
    if (body?.event === 'charge.success' && reference) {
      await this.billingService.confirmByReference(reference);
    }
    return { received: true };
  }
}
