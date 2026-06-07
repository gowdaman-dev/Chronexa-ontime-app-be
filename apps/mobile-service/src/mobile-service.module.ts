import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/prisma';
import { LoggingModule } from '@app/common';

const { MobileCommonService } = require('./shared/mobile-common.service');
const {
  MobileTransactionsController,
} = require('./transactions/transactions.controller');
const {
  MobileTransactionsService,
} = require('./transactions/transactions.service');
const { MobileLocationController } = require('./location/location.controller');
const { MobileLocationService } = require('./location/location.service');
const { MobileSparkController } = require('./spark/spark.controller');
const { MobileSparkService } = require('./spark/spark.service');
const { MobileIdsController } = require('./ids/ids.controller');
const { MobileIdsService } = require('./ids/ids.service');

@Module({
  imports: [ConfigModule, PrismaModule, LoggingModule],
  controllers: [
    MobileTransactionsController,
    MobileLocationController,
    MobileSparkController,
    MobileIdsController,
  ],
  providers: [
    MobileCommonService,
    MobileTransactionsService,
    MobileLocationService,
    MobileSparkService,
    MobileIdsService,
  ],
})
export class MobileServiceModule {}
