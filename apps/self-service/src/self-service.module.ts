import { Module } from '@nestjs/common';
import { SelfServiceController } from './self-service.controller';
import { SelfServiceService } from './self-service.service';
import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/prisma';
import { LoggingModule } from '@app/common';
import { WorkflowCommonService } from './shared/workflow-common.service';
import { LeavesController } from './leaves/leaves.controller';
import { LeavesService } from './leaves/leaves.service';
import { ShortPermissionsController } from './short-permissions/short-permissions.controller';
import { ShortPermissionsService } from './short-permissions/short-permissions.service';
import { MissingMovementsController } from './missing-movements/missing-movements.controller';
import { MissingMovementsService } from './missing-movements/missing-movements.service';
import { ManualTransactionsController } from './manual-transactions/manual-transactions.controller';
import { ManualTransactionsService } from './manual-transactions/manual-transactions.service';
import { MobileCommonService } from './shared/mobile-common.service';
import { MobileTransactionsController } from './transactions/transactions.controller';
import { MobileTransactionsService } from './transactions/transactions.service';
import { MobileLocationController } from './location/location.controller';
import { MobileLocationService } from './location/location.service';
import { MobileSparkController } from './spark/spark.controller';
import { MobileSparkService } from './spark/spark.service';
import { MobileIdsController } from './ids/ids.controller';
import { MobileIdsService } from './ids/ids.service';
import { LeaveTypesController } from './leave-types/leave-types.controller';
import { LeaveTypesService } from './leave-types/leave-types.service';
import { PermissionTypesController } from './permission-types/permission-types.controller';
import { PermissionTypesService } from './permission-types/permission-types.service';
import { HolidaysController } from './holidays/holidays.controller';
import { HolidaysService } from './holidays/holidays.service';
import { EventTransactionsController } from './event-transactions/event-transactions.controller';
import { EventTransactionsService } from './event-transactions/event-transactions.service';

@Module({
  imports: [ConfigModule, PrismaModule, LoggingModule],
  controllers: [
    SelfServiceController,
    LeavesController,
    ShortPermissionsController,
    MissingMovementsController,
    ManualTransactionsController,
    MobileTransactionsController,
    MobileLocationController,
    MobileSparkController,
    MobileIdsController,
    LeaveTypesController,
    PermissionTypesController,
    HolidaysController,
    EventTransactionsController,
  ],
  providers: [
    SelfServiceService,
    WorkflowCommonService,
    MobileCommonService,
    LeavesService,
    ShortPermissionsService,
    MissingMovementsService,
    ManualTransactionsService,
    MobileTransactionsService,
    MobileLocationService,
    MobileSparkService,
    MobileIdsService,
    LeaveTypesService,
    PermissionTypesService,
    HolidaysService,
    EventTransactionsService,
  ],
})
export class SelfServiceModule {}
