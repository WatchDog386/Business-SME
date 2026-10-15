import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ example: 'Hello John, your 10 Mbps package expires in 3 days. Renew via M-Pesa to stay connected.' })
  @IsString()
  @MinLength(1, { message: 'Write a message first.' })
  @MaxLength(900, { message: 'Keep the message under 900 characters.' })
  message: string;
}