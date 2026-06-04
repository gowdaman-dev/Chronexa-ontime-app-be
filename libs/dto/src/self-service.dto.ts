import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBooleanString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class VerifyLocationDto {
  @ApiProperty({
    type: [Number],
    example: [25.2048, 55.2708],
    minItems: 2,
    maxItems: 2,
    description: 'Latitude and longitude as [latitude, longitude]',
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates!: [number, number];
}

export class IdsPunchDto {
  @ApiProperty({ example: 'IN', description: 'Punch reason, usually IN or OUT' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: '25.2048,55.2708', description: 'Punch geolocation text' })
  @IsString()
  @IsNotEmpty()
  geolocation!: string;

  @ApiProperty({
    example: 'true',
    description: 'User entry flag from the mobile app',
    required: false,
  })
  @IsOptional()
  @IsBooleanString()
  user_entry_flag?: string;

  @ApiProperty({
    example: '1',
    description: 'Optional device identifier',
    required: false,
  })
  @IsOptional()
  @IsString()
  device_id?: string;
}

export class IdsVerifyEncounterDto extends IdsPunchDto {
  @ApiProperty({ example: 'E001', description: 'IDS subject identifier' })
  @IsString()
  @IsNotEmpty()
  subjectId!: string;
}
