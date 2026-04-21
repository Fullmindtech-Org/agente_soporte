import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GupshupService {
  private readonly logger = new Logger(GupshupService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly appId: string;
  private readonly sourcePhone: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = this.config.get<string>('GUPSHUP_API_URL', 'https://api.gupshup.io/sm/api/v1');
    this.apiKey = this.config.getOrThrow<string>('GUPSHUP_API_KEY');
    this.appId = this.config.getOrThrow<string>('GUPSHUP_APP_ID');
    this.sourcePhone = this.config.getOrThrow<string>('GUPSHUP_PHONE_NUMBER');
  }

  /**
   * Envía un mensaje de texto al número de teléfono del cliente.
   */
  async sendTextMessage(destinationPhone: string, text: string): Promise<void> {
    const url = `${this.apiUrl}/msg`;

    const body = new URLSearchParams({
      channel: 'whatsapp',
      source: this.sourcePhone,
      destination: destinationPhone,
      'src.name': this.appId,
      message: JSON.stringify({ type: 'text', text }),
    });

    try {
      await axios.post(url, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          apikey: this.apiKey,
        },
      });
      this.logger.log(`Mensaje enviado a ${destinationPhone}`);
    } catch (error: unknown) {
      this.logger.error(
        `Error al enviar mensaje a ${destinationPhone}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Extrae el número de teléfono del remitente del payload del webhook.
   */
  extractSenderPhone(payload: Record<string, unknown>): string {
    // Estructura típica del webhook de Gupshup
    const outerPayload = payload as { payload?: { payload?: { source?: string; sender?: { phone?: string } } } };
    return (
      outerPayload?.payload?.payload?.source ??
      outerPayload?.payload?.payload?.sender?.phone ??
      ''
    );
  }

  /**
   * Extrae el texto del mensaje del payload del webhook de Gupshup.
   */
  extractMessageText(payload: Record<string, unknown>): string {
    const outerPayload = payload as { payload?: { payload?: { payload?: { text?: string } } } };
    return outerPayload?.payload?.payload?.payload?.text ?? '';
  }
}
