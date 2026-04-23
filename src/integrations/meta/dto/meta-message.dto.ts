/**
 * DTOs para el Webhook de la API de WhatsApp Cloud de Meta.
 * Referencia: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */

export interface MetaWebhookPayload {
  object: string; // "whatsapp_business_account"
  entry: MetaEntry[];
}

export interface MetaEntry {
  id: string; // WABA ID
  changes: MetaChange[];
}

export interface MetaChange {
  value: MetaChangeValue;
  field: string; // "messages"
}

export interface MetaChangeValue {
  messaging_product: string; // "whatsapp"
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: MetaContact[];
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
}

export interface MetaContact {
  profile: { name: string };
  wa_id: string;
}

export interface MetaMessage {
  from: string;      // número del remitente (sin +)
  id: string;        // message ID único de WhatsApp
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'interactive' | 'button';
  text?: { body: string };
  image?: { id: string; caption?: string; mime_type: string; sha256: string };
  audio?: { id: string; mime_type: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: { payload: string; text: string };
}

export interface MetaStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}
