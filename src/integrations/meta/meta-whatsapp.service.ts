import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { MetaWebhookPayload, MetaMessage } from './dto/meta-message.dto';

@Injectable()
export class MetaWhatsappService {
  private readonly logger = new Logger(MetaWhatsappService.name);

  private readonly apiBaseUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly verifyToken: string;
  private readonly appSecret: string;

  constructor(private readonly config: ConfigService) {
    this.apiBaseUrl = this.config.get<string>('META_API_URL', 'https://graph.facebook.com/v19.0');
    this.accessToken = this.config.getOrThrow<string>('META_WHATSAPP_TOKEN');
    this.phoneNumberId = this.config.getOrThrow<string>('META_PHONE_NUMBER_ID');
    this.verifyToken = this.config.getOrThrow<string>('META_VERIFY_TOKEN');
    this.appSecret = this.config.getOrThrow<string>('META_APP_SECRET');
  }

  /**
   * Envía un mensaje de texto al número de teléfono del cliente.
   * @param to Número en formato internacional, con o sin +
   * @param text Cuerpo del mensaje
   */
  async sendTextMessage(to: string, text: string): Promise<void> {
    // Meta requiere el número sin el símbolo +
    const normalizedTo = to.replace(/^\+/, '');

    const url = `${this.apiBaseUrl}/${this.phoneNumberId}/messages`;

    try {
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: normalizedTo,
          type: 'text',
          text: {
            preview_url: false,
            body: text,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Mensaje enviado a ${normalizedTo}`);
    } catch (error: unknown) {
      this.logger.error(
        `Error al enviar mensaje a ${normalizedTo}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Verifica la firma HMAC-SHA256 del webhook enviada por Meta.
   * Retorna true si la firma es válida.
   */
  verifySignature(rawBody: Buffer, signatureHeader: string): boolean {
    if (!signatureHeader?.startsWith('sha256=')) {
      return false;
    }
    const expected = signatureHeader.slice('sha256='.length);
    const computed = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(computed, 'hex'));
  }

  /**
   * Retorna el verify_token para validar el handshake inicial del webhook.
   */
  getVerifyToken(): string {
    return this.verifyToken;
  }

  /**
   * Extrae el primer mensaje de texto del payload del webhook de Meta.
   * Retorna null si el payload no contiene mensajes de texto.
   */
  extractFirstTextMessage(payload: MetaWebhookPayload): { from: string; text: string } | null {
    const messages = payload?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages?.length) return null;

    const msg: MetaMessage = messages[0];

    if (msg.type === 'text' && msg.text?.body) {
      return { from: msg.from, text: msg.text.body };
    }

    // Soporte para respuestas de botones interactivos
    if (msg.type === 'interactive') {
      const reply =
        msg.interactive?.button_reply?.title ??
        msg.interactive?.list_reply?.title ??
        null;
      if (reply) return { from: msg.from, text: reply };
    }

    if (msg.type === 'button' && msg.button?.text) {
      return { from: msg.from, text: msg.button.text };
    }

    return null;
  }
}
