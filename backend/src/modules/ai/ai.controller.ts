import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatRequestDto, ChatResponseDto, SystemQueryDto, SystemResponseDto, DashboardDataDto } from './dto/chat.dto';

@ApiTags('AI Assistant')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with AI assistant' })
  @ApiResponse({ status: 200, description: 'AI response', type: ChatResponseDto })
  @ApiResponse({ status: 503, description: 'AI not configured' })
  async chat(@Body() request: ChatRequestDto): Promise<ChatResponseDto> {
    this.logger.log('Chat request received');
    return this.aiService.chatCompletion(request);
  }

  @Post('system/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query the SME platform system APIs' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'authorization', description: 'Bearer token', required: true })
  @ApiResponse({ status: 200, description: 'System response', type: SystemResponseDto })
  async systemQuery(
    @Body() query: SystemQueryDto,
    @Headers('authorization') authHeader: string,
  ): Promise<SystemResponseDto> {
    const authToken = authHeader?.replace('Bearer ', '');
    if (!authToken) {
      return { data: null, status: 401, error: 'Authorization token required' };
    }
    this.logger.log(`System query: ${query.method} ${query.endpoint}`);
    return this.aiService.systemQuery(query, authToken);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get dashboard data from SME platform' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'authorization', description: 'Bearer token', required: true })
  @ApiResponse({ status: 200, description: 'Dashboard data', type: DashboardDataDto })
  async dashboard(
    @Headers('authorization') authHeader: string,
  ): Promise<DashboardDataDto> {
    const authToken = authHeader?.replace('Bearer ', '');
    if (!authToken) {
      return { data: null, status: 401, error: 'Authorization token required' };
    }
    this.logger.log('Dashboard data request');
    return this.aiService.getDashboardData(authToken);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check AI service health' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async health() {
    return {
      status: 'ok',
      geminiConfigured: this.aiService.isConfigured(),
    };
  }
}