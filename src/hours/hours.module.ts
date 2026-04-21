import { Module } from '@nestjs/common';
import { HoursService } from './hours.service';
import { PlaneModule } from '../integrations/plane/plane.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [PlaneModule, CustomersModule],
  providers: [HoursService],
  exports: [HoursService],
})
export class HoursModule {}
