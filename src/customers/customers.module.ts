import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PlaneModule } from '../integrations/plane/plane.module';

@Module({
  imports: [PlaneModule],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
