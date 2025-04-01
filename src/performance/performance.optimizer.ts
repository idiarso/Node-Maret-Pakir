import { EventEmitter } from 'events';
import { Pool, PoolConfig } from 'pg';
import NodeCache from 'node-cache';

interface CacheConfig {
    ttl: number;
    checkPeriod: number;
    maxKeys: number;
}

export interface PerformanceMetrics {
    timestamp: Date;
    cpu: {
        usage: number;
        cores: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
    };
    database: {
        connections: number;
        idleConnections: number;
        waitingConnections: number;
    };
    cache: {
        hits: number;
        misses: number;
        keys: number;
    };
    responseTime: {
        average: number;
        max: number;
        min: number;
    };
}

export class PerformanceOptimizer extends EventEmitter {
    private cache: NodeCache;
    private dbPool: Pool;
    private metricsHistory: PerformanceMetrics[];
    private responseTimes: number[];
    private readonly maxMetricsHistory: number = 1000;
    private readonly maxResponseTimesHistory: number = 1000;

    constructor(
        cacheConfig: CacheConfig,
        poolConfig: PoolConfig,
        dbConfig: PoolConfig
    ) {
        super();
        this.cache = new NodeCache({
            stdTTL: cacheConfig.ttl,
            checkperiod: cacheConfig.checkPeriod,
            maxKeys: cacheConfig.maxKeys
        });
        this.dbPool = new Pool(dbConfig);
        this.metricsHistory = [];
        this.responseTimes = [];
        this.initialize();
        this.startMonitoring();
    }

    public async getCached<T>(key: string | number): Promise<T | undefined> {
        return this.cache.get<T>(key);
    }

    public async withConnection<T>(
        operation: (client: any) => Promise<T>
    ): Promise<T> {
        const startTime = Date.now();
        const client = await this.dbPool.connect();

        try {
            const result = await operation(client);
            this.recordResponseTime(Date.now() - startTime);
            return result;
        } finally {
            client.release();
        }
    }

    public async clearCache(pattern?: string): Promise<void> {
        if (pattern) {
            const keys = this.cache.keys();
            const matchingKeys = keys.filter(key => key.includes(pattern));
            this.cache.del(matchingKeys);
        } else {
            this.cache.flushAll();
        }
    }

    public getMetrics(
        startDate?: Date,
        endDate?: Date
    ): PerformanceMetrics[] {
        return this.metricsHistory.filter(metric => {
            if (startDate && metric.timestamp < startDate) return false;
            if (endDate && metric.timestamp > endDate) return false;
            return true;
        });
    }

    public getCurrentMetrics(): PerformanceMetrics {
        return this.metricsHistory[this.metricsHistory.length - 1];
    }

    private initialize(): void {
        // Monitor pool events
        this.dbPool.on('connect', () => {
            this.emit('poolConnection', { type: 'connect' });
        });

        this.dbPool.on('remove', () => {
            this.emit('poolConnection', { type: 'remove' });
        });

        this.dbPool.on('error', (error) => {
            this.emit('poolError', error);
        });
    }

    private startMonitoring(): void {
        // Collect metrics every minute
        setInterval(() => {
            this.collectMetrics();
        }, 60000);
    }

    private async collectMetrics(): Promise<void> {
        const metrics: PerformanceMetrics = {
            timestamp: new Date(),
            cpu: await this.getCPUUsage(),
            memory: this.getMemoryUsage(),
            database: await this.getDatabaseMetrics(),
            cache: this.getCacheMetrics(),
            responseTime: this.calculateResponseTimeMetrics()
        };

        this.metricsHistory.push(metrics);
        if (this.metricsHistory.length > this.maxMetricsHistory) {
            this.metricsHistory.shift();
        }

        this.emit('metricsCollected', metrics);
    }

    private async getCPUUsage(): Promise<{ usage: number; cores: number }> {
        // Implement CPU usage monitoring
        return {
            usage: 0,
            cores: 0
        };
    }

    private getMemoryUsage(): { total: number; used: number; free: number } {
        const used = process.memoryUsage();
        return {
            total: used.heapTotal,
            used: used.heapUsed,
            free: used.heapTotal - used.heapUsed
        };
    }

    private async getDatabaseMetrics(): Promise<{
        connections: number;
        idleConnections: number;
        waitingConnections: number;
    }> {
        const pool = this.dbPool as any;
        return {
            connections: pool._clients.length,
            idleConnections: pool._idle.length,
            waitingConnections: pool._waiting.length
        };
    }

    private getCacheMetrics(): {
        hits: number;
        misses: number;
        keys: number;
    } {
        const stats = this.cache.getStats();
        return {
            hits: stats.hits,
            misses: stats.misses,
            keys: this.cache.keys().length
        };
    }

    private calculateResponseTimeMetrics(): {
        average: number;
        max: number;
        min: number;
    } {
        if (this.responseTimes.length === 0) {
            return {
                average: 0,
                max: 0,
                min: 0
            };
        }

        const sorted = [...this.responseTimes].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        return {
            average: this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length,
            max: max,
            min: min
        };
    }

    private recordCacheHit(): void {
        this.cache.getStats().hits++;
    }

    private recordCacheMiss(): void {
        this.cache.getStats().misses++;
    }

    private recordResponseTime(time: number): void {
        this.responseTimes.push(time);
        if (this.responseTimes.length > this.maxResponseTimesHistory) {
            this.responseTimes.shift();
        }
    }

    public dispose(): void {
        this.cache.flushAll();
        this.dbPool.end();
    }
} 