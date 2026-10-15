import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BusinessGuard } from '../../common/guards/business.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentBusiness, CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser, STAFF_ROLES } from '../../common/types/auth-user.interface';
import { CallsService } from '../calls/calls.service';
import { SmsService } from './sms.service';
import { SendSmsDto } from './sms.dto';

@ApiTags('sms')
@Controller()
@UseGuards(JwtAuthGuard, BusinessGuard, RolesGuard)
@Roles(...STAFF_ROLES)
@ApiBearerAuth()
export class SmsController {
  constructor(
    private readonly sms: SmsService,
    private readonly calls: CallsService,
  ) {}

  @Get('sms/status')
  @ApiOperation({ summary: 'Whether SMS sending is configured, and what is missing' })
  status() {
    return { configured: this.sms.isConfigured(), missing: this.sms.missingConfig() };
  }

  @Post('customers/:customerId/sms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send an SMS to a client and log it against their account" })
  async send(
    @CurrentBusiness() business: { id: string },
    @CurrentUser() user: AuthUser,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: SendSmsDto,
  ) {
    const result = await this.sms.sendToCustomer(business.id, customerId, dto.message);

    // Only a delivered message goes in the history, so staff can see what was
    // already prompted without re-reading the provider dashboard.
    if (result.ok) {
      await this.calls.log(business.id, customerId, user.id, {
        channel: 'SMS',
        outcome: 'REACHED',
        notes: dto.message.trim(),
      });
    }

    return { sent: result.ok, ...result };
  }
}