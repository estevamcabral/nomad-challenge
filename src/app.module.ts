import { Module } from '@nestjs/common';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PostgresModule } from './infraestructure/postgres/postgres.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [PostgresModule, UploadsModule, StatisticsModule],
})
export class AppModule {}
