import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PostgresModule } from './infraestructure/postgres/postgres.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [PostgresModule, UploadsModule, StatisticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
