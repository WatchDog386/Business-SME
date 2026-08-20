import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BusinessGuard } from '../../common/guards/business.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentBusiness,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { AuthUser, UserRole } from '../../common/types/auth-user.interface';
import {
  CreateExpenseDto,
  ExpensesListQueryDto,
  UpdateExpenseDto,
} from './dto/expense.dto';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, BusinessGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  list(
    @CurrentBusiness() business: { id: string },
    @Query() query: ExpensesListQueryDto,
  ) {
    return this.expensesService.list(business.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense' })
  get(
    @CurrentBusiness() business: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expensesService.get(business.id, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Record an expense' })
  create(
    @CurrentBusiness() business: { id: string },
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(business.id, dto, user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update an expense' })
  update(
    @CurrentBusiness() business: { id: string },
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(business.id, id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete an expense (owner/manager)' })
  remove(
    @CurrentBusiness() business: { id: string },
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expensesService.remove(business.id, id, user.id);
  }
}