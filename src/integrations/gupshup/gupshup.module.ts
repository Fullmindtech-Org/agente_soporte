import { Module } from '@nestjs/common';
import { GupshupService } from './gupshup.service';

@Module({
  providers: [GupshupService],
  exports: [GupshupService],
})
export class GupshupModule {}
