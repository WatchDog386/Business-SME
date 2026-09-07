import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { ChatRequestDto, ChatResponseDto, SystemQueryDto, SystemResponseDto, DashboardDataDto } from './dto/chat.dto';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private readonly systemApiBase: string;
  private readonly businessId: string;

  constructor(private readonly configService: ConfigService) {
    this.systemApiBase = this.configService.get<string>('ai.systemApiBase') || 'http://localhost:4000';
    this.businessId = this.configService.get<string>('ai.businessId') || '';
  }

  onModuleInit() {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    const modelName = this.configService.get<string>('ai.geminiModel') || 'gemini-1.5-pro';

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: modelName });
      this.logger.log(`Gemini AI initialized with model: ${modelName}`);
    } else {
      this.logger.warn('GEMINI_API_KEY not configured. AI features will not work.');
    }
  }

  private getSystemPrompt(): string {
    return `You are an AI assistant for the Kenya SME Platform.
    You have access to business data, sales, customers, products, and expenses.
    Help users with:
    - Sales analysis and insights
    - Customer questions and support
    - Product inventory and management
    - Expense tracking and analysis
    - Business optimization suggestions
    
    Always be helpful, professional, and focused on SME business growth.
    Use the provided context and tools to give accurate, actionable advice.`;
  }

  async chatCompletion(request: ChatRequestDto): Promise<ChatResponseDto> {
    if (!this.model) {
      throw new Error('Gemini AI not configured. Please set GEMINI_API_KEY environment variable.');
    }

    const systemPrompt = this.getSystemPrompt();
    
    const generationConfig: GenerationConfig = {
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.maxTokens ?? 1024,
    };

    try {
      const chat = this.model.startChat({
        generationConfig,
        history: request.messages.slice(0, -1).map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      });

      const lastMessage = request.messages[request.messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      const text = response.text();

      const usageMetadata = response.usageMetadata;
      const usage = usageMetadata
        ? {
            promptTokens: usageMetadata.promptTokenCount || 0,
            completionTokens: usageMetadata.candidatesTokenCount || 0,
            totalTokens: usageMetadata.totalTokenCount || 0,
          }
        : undefined;

      return {
        response: text,
        usage,
        model: this.configService.get<string>('ai.geminiModel') || 'gemini-1.5-pro',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Gemini API error: ${err.message}`, err.stack);
      throw new Error(`AI service error: ${err.message}`);
    }
  }

  async systemQuery(query: SystemQueryDto, authToken: string): Promise<SystemResponseDto> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    if (this.businessId) {
      headers['X-Business-Id'] = this.businessId;
    }

    try {
      const url = `${this.systemApiBase}/api/v1/${query.endpoint}`;
      const response = await fetch(url, {
        method: query.method || 'GET',
        headers,
        body: query.body ? JSON.stringify(query.body) : undefined,
      });

      const data = await response.json();

      return {
        data,
        status: response.status,
        error: response.ok ? undefined : data.message || 'Request failed',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`System query error: ${err.message}`, err.stack);
      return {
        data: null,
        status: 'error',
        error: err.message,
      };
    }
  }

  async getDashboardData(authToken: string): Promise<DashboardDataDto> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${authToken}`,
    };

    if (this.businessId) {
      headers['X-Business-Id'] = this.businessId;
    }

    try {
      const response = await fetch(`${this.systemApiBase}/api/v1/dashboard`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      return {
        data,
        status: response.status,
        error: response.ok ? undefined : data.message || 'Request failed',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Dashboard query error: ${err.message}`, err.stack);
      return {
        data: null,
        status: 'error',
        error: err.message,
      };
    }
  }

  isConfigured(): boolean {
    return !!this.model;
  }
}