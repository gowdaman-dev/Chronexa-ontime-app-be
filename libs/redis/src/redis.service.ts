import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: RedisClient;
  private readonly defaultTTL: number = 3600;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');

    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      showFriendlyErrorStack: true,
    });

    this.client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.client.on('ready', () => {
      console.log('Redis is ready');
    });
  }

  getClient(): RedisClient {
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl || this.defaultTTL;
      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
    }
  }
  async del(key: string | string[]): Promise<void> {
    try {
      if (Array.isArray(key)) {
        await this.client.del(...key);
      } else {
        await this.client.del(key);
      }
    } catch (error) {
      console.error(`Error deleting key:`, error);
    }
  }
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error(`Error deleting pattern ${pattern}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error(`Error setting expiry for key ${key}:`, error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      console.error(`Error decrementing key ${key}:`, error);
      return 0;
    }
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.client.hset(key, field, serialized);
    } catch (error) {
      console.error(`Error setting hash field ${key}.${field}:`, error);
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hget(key, field);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error getting hash field ${key}.${field}:`, error);
      return null;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    try {
      const data = await this.client.hgetall(key);
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value) as T;
      }
      return result;
    } catch (error) {
      console.error(`Error getting all hash fields for ${key}:`, error);
      return {};
    }
  }
  async flushAll(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      console.error('Error flushing Redis:', error);
    }
  }

  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const value = await fallback();

    await this.set(key, value, ttl);

    return value;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
