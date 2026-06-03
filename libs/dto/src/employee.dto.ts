import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  ApiEmpNoProperty,
  ApiFirstnameEngProperty,
  ApiLastnameEngProperty,
  ApiFirstnameArbProperty,
  ApiLastnameArbProperty,
  ApiCardNumberProperty,
  ApiPinProperty,
  ApiOrganizationIdProperty,
  ApiGradeIdProperty,
  ApiDesignationIdProperty,
  ApiCitizenshipIdProperty,
  ApiEmployeeTypeIdProperty,
  ApiDepartmentIdProperty,
  ApiManagerIdProperty,
  ApiLocationIdProperty,
  ApiContractCompanyIdProperty,
  ApiJoinDateProperty,
  ApiActiveDateProperty,
  ApiInactiveDateProperty,
  ApiNationalIdProperty,
  ApiNationalIdExpiryDateProperty,
  ApiPassportNumberProperty,
  ApiPassportExpiryDateProperty,
  ApiPassportIssueCountryIdProperty,
  ApiMobileProperty,
  ApiEmailProperty,
  ApiPersonalEmailProperty,
  ApiGenderProperty,
  ApiPhotoFileNameProperty,
  ApiRemarksProperty,
  ApiEmployeeStatusProperty,
  ApiCostCenterProperty,
  ApiCostCodeProperty,
  ApiActiveFlagProperty,
  ApiLocalFlagProperty,
  ApiPunchFlagProperty,
  ApiManagerFlagProperty,
  ApiOnReportsFlagProperty,
  ApiIncludeEmailFlagProperty,
  ApiOpenShiftFlagProperty,
  ApiOvertimeFlagProperty,
  ApiWebPunchFlagProperty,
  ApiShiftFlagProperty,
  ApiSapUserFlagProperty,
  ApiLocalUserFlagProperty,
  ApiInpayrollFlagProperty,
  ApiShareRosterFlagProperty,
  ApiGeofenceFlagProperty,
  ApiEmailNotificationsFlagProperty,
  ApiCheckInoutSelfieFlagProperty,
  ApiCalculateMonthlyMissedHrsFlagProperty,
  ApiExcludeFromIntegrationFlagProperty,
  ApiEmployeeIdProperty,
  ApiCreatedIdProperty,
  ApiLastUpdatedIdProperty,
  ApiCreatedDateProperty,
  ApiLastUpdatedDateProperty,
} from './employee.doc';

export class CreateEmployeeDto {
  @ApiEmpNoProperty()
  @IsString()
  @MaxLength(50)
  empNo!: string;

  @ApiFirstnameEngProperty()
  @IsString()
  @MaxLength(800)
  firstnameEng!: string;

  @ApiLastnameEngProperty()
  @IsString()
  @MaxLength(800)
  lastnameEng!: string;

  @ApiFirstnameArbProperty()
  @IsString()
  @MaxLength(800)
  firstnameArb!: string;

  @ApiLastnameArbProperty()
  @IsString()
  @MaxLength(800)
  lastnameArb!: string;

  @ApiCreatedIdProperty()
  @IsInt()
  createdId!: number;

  @ApiCardNumberProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cardNumber?: string;

  @ApiPinProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pin?: string;

  @ApiOrganizationIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  organizationId?: number;

  @ApiGradeIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  gradeId?: number;

  @ApiDesignationIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  designationId?: number;

  @ApiCitizenshipIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  citizenshipId?: number;

  @ApiEmployeeTypeIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  employeeTypeId?: number;

  @ApiDepartmentIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @ApiManagerIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  managerId?: number;

  @ApiLocationIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  locationId?: number;

  @ApiContractCompanyIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  contractCompanyId?: number;

  @ApiJoinDateProperty({ required: false })
  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @ApiActiveDateProperty({ required: false })
  @IsOptional()
  @IsDateString()
  activeDate?: string;

  @ApiInactiveDateProperty({ required: false })
  @IsOptional()
  @IsDateString()
  inactiveDate?: string;

  @ApiNationalIdProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationalId?: string;

  @ApiNationalIdExpiryDateProperty({ required: false })
  @IsOptional()
  @IsDateString()
  nationalIdExpiryDate?: string;

  @ApiPassportNumberProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  passportNumber?: string;

  @ApiPassportExpiryDateProperty({ required: false })
  @IsOptional()
  @IsDateString()
  passportExpiryDate?: string;

  @ApiPassportIssueCountryIdProperty({ required: false })
  @IsOptional()
  @IsInt()
  passportIssueCountryId?: number;

  @ApiMobileProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mobile?: string;

  @ApiEmailProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPersonalEmailProperty({ required: false })
  @IsOptional()
  @IsString()
  personalEmail?: string;

  @ApiGenderProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  gender?: string;

  @ApiPhotoFileNameProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoFileName?: string;

  @ApiRemarksProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(900)
  remarks?: string;

  @ApiEmployeeStatusProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeStatus?: string;

  @ApiCostCenterProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  costCenter?: string;

  @ApiCostCodeProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  costCode?: string;

  @ApiActiveFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  activeFlag?: boolean;

  @ApiLocalFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  localFlag?: boolean;

  @ApiPunchFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  punchFlag?: boolean;

  @ApiManagerFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  managerFlag?: boolean;

  @ApiOnReportsFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  onReportsFlag?: boolean;

  @ApiIncludeEmailFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  includeEmailFlag?: boolean;

  @ApiOpenShiftFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  openShiftFlag?: boolean;

  @ApiOvertimeFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  overtimeFlag?: boolean;

  @ApiWebPunchFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  webPunchFlag?: boolean;

  @ApiShiftFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  shiftFlag?: boolean;

  @ApiSapUserFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  sapUserFlag?: boolean;

  @ApiLocalUserFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  localUserFlag?: boolean;

  @ApiInpayrollFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  inpayrollFlag?: boolean;

  @ApiShareRosterFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  shareRosterFlag?: boolean;

  @ApiGeofenceFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  geofenceFlag?: boolean;

  @ApiEmailNotificationsFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailNotificationsFlag?: boolean;

  @ApiCheckInoutSelfieFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  checkInoutSelfieFlag?: boolean;

  @ApiCalculateMonthlyMissedHrsFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  calculateMonthlyMissedHrsFlag?: boolean;

  @ApiExcludeFromIntegrationFlagProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  excludeFromIntegrationFlag?: boolean;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiLastUpdatedIdProperty()
  @IsOptional()
  @IsInt()
  lastUpdatedId?: number;
}

export class EmployeeResponseDto {
  @ApiEmployeeIdProperty()
  employeeId!: number;

  @ApiEmpNoProperty()
  empNo!: string;

  @ApiFirstnameEngProperty()
  firstnameEng!: string;

  @ApiLastnameEngProperty()
  lastnameEng!: string;

  @ApiFirstnameArbProperty()
  firstnameArb!: string;

  @ApiLastnameArbProperty()
  lastnameArb!: string;

  @ApiEmailProperty({ required: false })
  email?: string | null;

  @ApiMobileProperty({ required: false })
  mobile?: string | null;

  @ApiDepartmentIdProperty({ required: false })
  departmentId?: number | null;

  @ApiDesignationIdProperty({ required: false })
  designationId?: number | null;

  @ApiActiveFlagProperty({ required: false })
  activeFlag?: boolean | null;

  @ApiEmployeeStatusProperty({ required: false })
  employeeStatus?: string | null;

  @ApiCreatedDateProperty()
  createdDate!: Date;

  @ApiLastUpdatedDateProperty()
  lastUpdatedDate!: Date;
}
