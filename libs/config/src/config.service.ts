import { Injectable } from '@nestjs/common';
import { ConfigService as GlobalConfigService } from '@nestjs/config';
@Injectable()
export class ConfigService extends GlobalConfigService {}
