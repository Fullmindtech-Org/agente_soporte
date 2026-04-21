import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { AgentService } from '../agent/agent.service';

class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  threadId?: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async chat(@Body() body: ChatMessageDto): Promise<{ reply: string }> {
    const threadId = body.threadId?.trim() || `web-${Date.now()}`;
    const reply = await this.agentService.processMessage(
      threadId,
      'EMAIL', // canal web se trata como EMAIL (sin formateo WhatsApp)
      body.message,
    );
    return { reply };
  }
}
