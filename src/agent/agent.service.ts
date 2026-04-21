import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agent } from '@mastra/core/agent';
import { createSupportAgent } from './support-agent';
import { ConversationService, Channel } from '../conversation/conversation.service';
import { CustomersService } from '../customers/customers.service';
import { UptimeService } from '../integrations/uptime/uptime.service';
import { HoursService } from '../hours/hours.service';
import { TicketsService } from '../tickets/tickets.service';
import { FaqService } from '../faq/faq.service';
import { PlaneService } from '../integrations/plane/plane.service';

@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);
  private agent: Agent;

  constructor(
    private readonly config: ConfigService,
    private readonly conversationService: ConversationService,
    private readonly customersService: CustomersService,
    private readonly uptimeService: UptimeService,
    private readonly hoursService: HoursService,
    private readonly ticketsService: TicketsService,
    private readonly faqService: FaqService,
    private readonly planeService: PlaneService,
  ) {}

  onModuleInit(): void {
    const llmApiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    const llmModel = this.config.get<string>('LLM_MODEL', 'gpt-4o');

    this.agent = createSupportAgent(
      this.customersService,
      this.uptimeService,
      this.hoursService,
      this.ticketsService,
      this.faqService,
      this.planeService,
      llmApiKey,
      llmModel,
    );

    this.logger.log(`Agente inicializado con modelo: ${llmModel}`);
  }

  /**
   * Procesa un mensaje entrante y retorna la respuesta del agente.
   * Mantiene el historial de la conversación por threadId.
   */
  async processMessage(
    threadId: string,
    channel: Channel,
    userMessage: string,
  ): Promise<string> {
    // Guardar contexto de la sesión
    this.conversationService.getOrCreate(threadId, channel);
    this.conversationService.appendMessage(threadId, 'user', userMessage);

    // Obtener historial para construir el contexto del agente
    const history = this.conversationService.getMessages(threadId);

    // Construir mensajes en formato Mastra
    const messages = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    try {
      // Incluir canal y teléfono del cliente (threadId) para que el agente los use directamente
      const enrichedMessage = `[Canal: ${channel}] [Teléfono del cliente: ${threadId}] ${userMessage}`;

      // Reemplazar el último mensaje user con el enriquecido
      if (messages.length > 0) {
        messages[messages.length - 1] = { role: 'user', content: enrichedMessage };
      }

      const response = await this.agent.generate(messages as never);
      const agentReply = response.text ?? 'Lo siento, no pude procesar tu mensaje en este momento.';

      // Guardar respuesta del agente
      this.conversationService.appendMessage(threadId, 'assistant', agentReply);

      return agentReply;
    } catch (error: unknown) {
      this.logger.error(`Error al procesar mensaje para ${threadId}: ${(error as Error).message}`);
      return 'Ocurrió un error al procesar tu solicitud. Por favor, intentá de nuevo en unos minutos.';
    }
  }
}
