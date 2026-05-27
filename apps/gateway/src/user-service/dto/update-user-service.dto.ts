import { PartialType } from '@nestjs/swagger';
import { CreateUserServiceDto } from './create-user-service.dto';

export class UpdateUserServiceDto extends PartialType(CreateUserServiceDto) {}
