import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

export const CACHE_TTL = {
  LIST: 1800,
  DETAIL: 3600,
  AUTH_SESSION: 86400,
  AD_TOKEN: 300,
  BLACKLIST: 86400,
} as const;

export const CACHE_KEYS = {
  AUTH_SESSION: (token: string) => `auth:session:${token}`,
  AUTH_BLACKLIST: (jti: string) => `auth:blacklist:${jti}`,
  AD_TOKEN: (hash: string) => `auth:ad_token:${hash}`,
  USERS_LIST: (limit: number, offset: number) => `users:list:${limit}:${offset}`,
  USER_DETAIL: (id: number) => `user:id:${id}`,
  EMPLOYEES_LIST: (limit: number, offset: number) =>
    `employees:list:${limit}:${offset}`,
  EMPLOYEE_DETAIL: (id: number) => `employee:id:${id}`,
} as const;

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.redis.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    return this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    return this.redis.delPattern(pattern);
  }

  async isHealthy(): Promise<boolean> {
    return this.redis.isHealthy();
  }

  async exists(key: string): Promise<boolean> {
    return this.redis.exists(key);
  }

  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    return this.redis.getOrSet(key, fallback, ttl);
  }
}
