import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@app/auth';
import { ApiSelfServiceOperation } from '@app/dto/self-service.doc';
import { ApiMissingMovementFilters } from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from '../self-service.service';
import { toUserPayload } from '../self-service.helpers';

@ApiTags('Missing Movement')
@Controller({ version: '1' })
export class MissingMovementController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

  @Get('missingMovement/all')
  @ApiSelfServiceOperation('Get all missing movements', ApiMissingMovementFilters())
  getAllMissingMovements(@Query() query: any) {
    return this.selfService.workflow('self_service.missing_movements.all', { query });
  }

  @Get('missingMovement/team/all')
  @ApiSelfServiceOperation('Get team missing movements', ApiMissingMovementFilters())
  getTeamMissingMovements(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.missing_movements.team_all', {
      user: toUserPayload(user),
      query,
    });
  }
}
