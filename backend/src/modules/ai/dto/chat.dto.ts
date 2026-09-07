import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant', 'system'] })
  @IsString()
  role: 'user' | 'assistant' | 'system';

  @ApiProperty()
  @IsString()
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @ApiPropertyOptional({ minimum: 0, maximum: 2, default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number = 0.7;

  @ApiPropertyOptional({ minimum: 1, maximum: 4096, default: 1024 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4096)
  maxTokens?: number = 1024;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  stream?: boolean = false;
}

export class ChatResponseDto {
  @ApiProperty()
  response: string;

  @ApiPropertyOptional()
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  @ApiProperty()
  model: string;
}

export class SystemQueryDto {
  @ApiProperty()
  @IsString()
  endpoint: string;

  @ApiPropertyOptional({ enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' })
  @IsOptional()
  @IsString()
  method?: string = 'GET';

  @ApiPropertyOptional()
  @IsOptional()
  params?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  body?: Record<string, any>;
}

export class SystemResponseDto {
  @ApiProperty()
  data: any;

  @ApiProperty()
  status: string | number;

  @ApiPropertyOptional()
  error?: string;
}

export class DashboardDataDto {
  @ApiProperty()
  data: any;

  @ApiProperty()
  status: string | number;

  @ApiPropertyOptional()
  error?: string;
}