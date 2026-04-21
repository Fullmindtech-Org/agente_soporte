import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { PlaneModule } from '../integrations/plane/plane.module';

@Module({
  imports: [PlaneModule],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
