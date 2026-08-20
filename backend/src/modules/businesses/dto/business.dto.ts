import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BUSINESS_TYPES } from '../entities/business.entity';
import { UserRole } from '../../../common/types/auth-user.interface';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Mama Njeri Salon' })
  @IsString()
  @IsNotEmpty({ message: 'Enter your business name.' })
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: BUSINESS_TYPES, example: 'SALON' })
  @IsIn(BUSINESS_TYPES, { message: 'Select a valid business type.' })
  businessType: string;

  @ApiPropertyOptional({ example: '0712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Umoja, Nairobi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiPropertyOptional({ example: 'KES', default: 'KES' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'Africa/Nairobi', default: 'Africa/Nairobi' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'Mama Njeri Salon & Spa' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ enum: BUSINESS_TYPES })
  @IsOptional()
  @IsIn(BUSINESS_TYPES)
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  county?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class AddMemberDto {
  @ApiProperty({ example: 'mercy@example.com' })
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MANAGER })
  @IsIn(Object.values(UserRole), { message: 'Select a valid role.' })
  role: UserRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.ACCOUNTANT })
  @IsIn(Object.values(UserRole), { message: 'Select a valid role.' })
  role: UserRole;
}