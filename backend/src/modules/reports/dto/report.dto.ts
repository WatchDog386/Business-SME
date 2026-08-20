import { Type } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeQueryDto {
  @ApiPropertyOptional({ description: 'ISO date, inclusive start' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date, exclusive end' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class ReportRangeQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}