import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

class SetPlanDto {
  @IsIn(['FREE', 'GROWTH', 'SCALE'])
  plan: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('summary')
  summary() {
    return this.adminService.summary();
  }

  @Get('businesses')
  businesses() {
    return this.adminService.listBusinesses();
  }

  @Get('businesses/:id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getBusinessDetail(id);
  }

  @Patch('businesses/:id/plan')
  setPlan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetPlanDto) {
    return this.adminService.setPlan(id, dto.plan);
  }

  @Get('payments')
  payments(@Query('status') status?: string) {
    return this.adminService.listPayments(status);
  }

  @Post('payments/:id/confirm')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.confirmPayment(id);
  }

  @Get('users')
  users() {
    return this.adminService.listUsers();
  }

  @Get('settings')
  settings() {
    return this.adminService.settings();
  }
}
