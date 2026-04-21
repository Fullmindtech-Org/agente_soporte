import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { PlaneModule } from '../integrations/plane/plane.module';

@Module({
  imports: [PlaneModule],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
