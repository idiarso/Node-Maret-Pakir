import Redis from 'ioredis';

interface MemoryCache {
  [key: string]: {
    value: any;
    expiry: number | null;
  };
}

export class CacheService {
  private static instance: CacheService;
  private redis: Redis | null = null;
  private memoryCache: MemoryCache = {};
  private defaultTTL: number = 3600; // 1 hour in seconds
  private useRedis: boolean = false;

  private constructor() {
    // Using memory cache only
    this.useRedis = false;
    this.redis = null;
    console.log('Cache service initialized with memory cache');
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.redis) {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        const item = this.memoryCache[key];
        if (!item) return null;
        
        if (item.expiry && item.expiry < Date.now()) {
          delete this.memoryCache[key];
          return null;
        }
        
        return item.value;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
      } else {
        this.memoryCache[key] = {
          value,
          expiry: ttl ? Date.now() + (ttl * 1000) : null
        };
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(key);
      } else {
        delete this.memoryCache[key];
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(pattern: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        const regex = new RegExp(pattern.replace('*', '.*'));
        Object.keys(this.memoryCache).forEach(key => {
          if (regex.test(key)) {
            delete this.memoryCache[key];
          }
        });
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await this.clear(pattern);
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttl);
    return fresh;
  }
} 