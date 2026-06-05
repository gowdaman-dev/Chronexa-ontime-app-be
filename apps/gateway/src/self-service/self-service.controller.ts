import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@app/auth';
import {
  IdsPunchDto,
  IdsVerifyEncounterDto,
  VerifyLocationDto,
} from '@app/dto';
import {
  ApiIdsPunchOperation,
  ApiIdsVerifyEncounterOperation,
  ApiSimpleSelfServiceReadOperation,
  ApiVerifyLocationOperation,
} from '@app/dto/self-service.doc';
import { SelfServiceGatewayService } from './self-service.service';

@ApiTags('Mobile Self Service')
@Controller({ version: '1' })
export class SelfServiceController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

  private serializeFile(file: any) {
    if (!file) return file;
    return {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferBase64: Buffer.isBuffer(file.buffer)
        ? file.buffer.toString('base64')
        : file.buffer,
    };
  }

  @Get('mobile/transactions/my-check-in-out')
  @ApiSimpleSelfServiceReadOperation('Get today check-in and check-out for current mobile employee')
  getMyCheckInOut(@CurrentUser() user: AuthUser) {
    return this.selfService.getMyCheckInOut(user.employeeId);
  }

  @Get('mobile/location/my-work-location')
  @ApiSimpleSelfServiceReadOperation('Get assigned work location for current mobile employee')
  getMyWorkLocation(@CurrentUser() user: AuthUser) {
    return this.selfService.getMyWorkLocation(user.employeeId);
  }

  @Get('mobile/transactions/last-transactions')
  @ApiSimpleSelfServiceReadOperation('Get recent mobile employee transactions')
  getLastTransactions(@CurrentUser() user: AuthUser) {
    return this.selfService.getLastTransactions(user.employeeId);
  }

  @Post('mobile/location/verify-assigned-location')
  @ApiVerifyLocationOperation('Verify coordinates against assigned work location')
  verifyAssignedLocation(
    @CurrentUser() user: AuthUser,
    @Body() dto: VerifyLocationDto,
  ) {
    return this.selfService.verifyAssignedLocation(user.employeeId, dto);
  }

  @Post('mobile/location/verify-location')
  @ApiVerifyLocationOperation('Verify coordinates against any configured work location')
  verifyLocation(@Body() dto: VerifyLocationDto) {
    return this.selfService.verifyLocation(dto);
  }

  @Get('org/spark/todayLocation')
  @ApiSimpleSelfServiceReadOperation('Get Spark today location for current employee')
  getSparkTodayLocation(@CurrentUser() user: AuthUser) {
    return this.selfService.getSparkTodayLocation(user.employeeId);
  }

  @Post('ids-punch/punch')
  @UseInterceptors(FileInterceptor('image'))
  @ApiIdsPunchOperation()
  punch(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: any,
    @Body() body: IdsPunchDto,
    @Req() req: any,
  ) {
    return this.selfService.punch({
      employeeId: user.employeeId,
      file: this.serializeFile(file),
      body,
      userAgent: req.headers?.['user-agent'],
      appVersion: req.headers?.['app-version'],
    });
  }

  @Post('ids-punch/verify-encounter')
  @UseInterceptors(FileInterceptor('image'))
  @ApiIdsVerifyEncounterOperation()
  verifyEncounter(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: any,
    @Body() body: IdsVerifyEncounterDto,
    @Req() req: any,
  ) {
    return this.selfService.verifyEncounter({
      employeeId: user.employeeId,
      file: this.serializeFile(file),
      body,
      userAgent: req.headers?.['user-agent'],
      appVersion: req.headers?.['app-version'],
    });
  }
}
