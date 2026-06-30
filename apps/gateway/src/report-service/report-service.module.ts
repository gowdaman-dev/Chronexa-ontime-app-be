import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { LoggingModule } from '@app/common';
import { ReportGatewayService } from './report-gateway.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [
    LoggingModule,
    ClientsModule.registerAsync([
      {
        name: 'REPORT_SERVICE',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [config.getOrThrow<string>('natsUrl')],
          },
        }),
      },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportGatewayService],
  exports: [ReportGatewayService],
})
export class ReportServiceModule {}
