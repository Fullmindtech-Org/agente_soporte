import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { PlaneWebhookController } from './plane-webhook.controller';
import { AgentModule } from '../agent/agent.module';
import { GupshupModule } from '../integrations/gupshup/gupshup.module';
import { CustomersModule } from '../customers/customers.module';
import { PlaneModule } from '../integrations/plane/plane.module';

@Module({
  imports: [AgentModule, GupshupModule, CustomersModule, PlaneModule],
  controllers: [WhatsappController, PlaneWebhookController],
})
export class WebhooksModule {}
