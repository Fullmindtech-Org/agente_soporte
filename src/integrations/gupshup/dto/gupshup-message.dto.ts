export interface GupshupIncomingMessage {
  app: string;
  timestamp: string;
  version: number;
  type: string;
  payload: {
    id: string;
    source: string; // phone number del remitente
    type: string;
    payload: {
      text?: string;
    };
    sender?: {
      phone: string;
      name?: string;
      country_code?: string;
    };
  };
}

export interface GupshupWebhookPayload {
  type: string;
  payload: GupshupIncomingMessage;
}
