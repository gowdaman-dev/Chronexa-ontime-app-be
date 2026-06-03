import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  ApiLoginProperty,
  ApiPasswordProperty,
  ApiEmployeeIdProperty,
  ApiCreatedIdProperty,
  ApiLastUpdatedIdProperty,
  ApiAccessControlPanelProperty,
  ApiAccessMobileAppProperty,
  ApiIsAdUserProperty,
  ApiAppTypeProperty,
  ApiActiveUserProperty,
  ApiLastLoginProperty,
  ApiUserIdProperty,
  ApiEmployeeNameProperty,
  ApiEmailProperty,
  ApiCreatedDateProperty,
  ApiLastUpdatedDateProperty,
} from './user.doc';

export class CreateUserDto {
  @ApiLoginProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  login?: string;

  @ApiPasswordProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  password?: string;

  @ApiEmployeeIdProperty()
  @IsInt()
  employeeId!: number;

  @ApiCreatedIdProperty()
  @IsInt()
  createdId!: number;

  @ApiAccessControlPanelProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  accessControlPanel?: boolean;

  @ApiAccessMobileAppProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  accessMobileApp?: boolean;

  @ApiIsAdUserProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAdUser?: boolean;

  @ApiAppTypeProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  appType?: string;

  @ApiActiveUserProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  activeUser?: boolean;

  @IsOptional()
  @IsDateString()
  lastLogin?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiLastUpdatedIdProperty()
  @IsOptional()
  @IsInt()
  lastUpdatedId?: number;
}

export class UserResponseDto {
  @ApiUserIdProperty()
  userId!: number;

  @ApiLoginProperty({ required: false })
  login?: string;

  @ApiEmployeeIdProperty()
  employeeId!: number;

  @ApiEmployeeNameProperty({ required: false })
  employeeName?: string;

  @ApiEmailProperty({ required: false })
  email?: string;

  @ApiAccessControlPanelProperty({ required: false })
  accessControlPanel?: boolean;

  @ApiAccessMobileAppProperty({ required: false })
  accessMobileApp?: boolean;

  @ApiIsAdUserProperty({ required: false })
  isAdUser?: boolean;

  @ApiAppTypeProperty({ required: false })
  appType?: string;

  @ApiActiveUserProperty({ required: false })
  activeUser?: boolean;

  @ApiLastLoginProperty({ required: false })
  lastLogin?: Date;

  @ApiCreatedDateProperty()
  createdDate!: Date;

  @ApiLastUpdatedDateProperty()
  lastUpdatedDate!: Date;
}
