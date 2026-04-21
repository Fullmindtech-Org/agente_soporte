import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GupshupService } from '../integrations/gupshup/gupshup.service';
import { AgentService } from '../agent/agent.service';

@Controller('webhooks/whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly gupshupService: GupshupService,
    private readonly agentService: AgentService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Webhook receptor de mensajes entrantes desde Gupshup.
   * Responde 200 de inmediato y procesa el mensaje en background.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  handleIncoming(
    @Body() body: Record<string, unknown>,
    @Headers('x-hub-signature') signature: string,
  ): { status: string } {
    // Extraer datos del payload sin bloquear la respuesta HTTP
    void this.processAsync(body, signature);
    return { status: 'received' };
  }

  private async processAsync(
    body: Record<string, unknown>,
    _signature: string,
  ): Promise<void> {
    try {
      const senderPhone = this.gupshupService.extractSenderPhone(body);
      const messageText = this.gupshupService.extractMessageText(body);

      if (!senderPhone || !messageText) {
        this.logger.warn('Webhook recibido sin número de teléfono o texto. Ignorado.');
        return;
      }

      this.logger.log(`Mensaje entrante de ${senderPhone}: "${messageText.substring(0, 50)}..."`);

      // Procesar con el agente (mantiene historial por número de teléfono)
      const reply = await this.agentService.processMessage(
        senderPhone,
        'WHATSAPP',
        messageText,
      );

      // Enviar la respuesta al cliente
      await this.gupshupService.sendTextMessage(senderPhone, reply);
    } catch (error: unknown) {
      this.logger.error(`Error al procesar webhook de WhatsApp: ${(error as Error).message}`);
    }
  }
}
