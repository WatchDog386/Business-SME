import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PAYMENT_METHODS, SALE_TYPES } from '../entities/sale.entity';

export class SaleItemInputDto {
  @ApiPropertyOptional({ example: 'uuid-of-product' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-service' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ enum: SALE_TYPES })
  @IsOptional()
  @IsEnum(SALE_TYPES)
  saleType?: (typeof SALE_TYPES)[number];

  @ApiProperty({
    type: [SaleItemInputDto],
    description:
      'Line items. May be empty only when `total` is provided (amount-only express sale, e.g. recorded from an M-Pesa SMS).',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemInputDto)
  items: SaleItemInputDto[];

  @ApiPropertyOptional({
    example: 1500,
    description:
      'Explicit sale total for amount-only express sales. Required when `items` is empty.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  total?: number;

  @ApiPropertyOptional({ example: 'uuid-of-customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-employee' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 16, description: 'Tax rate as a percentage, e.g. 16 for 16%' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiProperty({ enum: PAYMENT_METHODS, example: 'CASH' })
  @IsEnum(PAYMENT_METHODS, { message: 'Select a valid payment method.' })
  paymentMethod: string;

  @ApiPropertyOptional({
    example: 0,
    description:
      'Amount paid now. For credit sales leave 0; for partial payments enter the amount received.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({ example: 'QRT8XYZ9A1' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional({ example: 'Walk-in customer' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'random-uuid-generated-on-the-client' })
  @IsString()
  @IsNotEmpty({ message: 'Idempotency key is required.' })
  @MaxLength(64)
  idempotencyKey: string;
}

export class RecordPaymentDto {
  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: PAYMENT_METHODS, example: 'M-PESA' })
  @IsEnum(PAYMENT_METHODS, { message: 'Select a valid payment method.' })
  method: string;

  @ApiPropertyOptional({ example: 'QRT8XYZ9A1' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
