import { EventEmitter } from 'events';
import { ReportingSystem } from '../reporting/report.interface';
import { PaymentSystem } from '../payment/payment.interface';
import { ParkingManager } from '../parking/parking.manager';
import { PerformanceOptimizer } from '../performance/performance.optimizer';
import { PaymentTransaction } from '../payment/payment.interface';
import { ParkingStats } from '../parking/parking.manager';
import { PerformanceMetrics } from '../performance/performance.optimizer';

type ReportType = 'daily_summary' | 'payment_report' | 'occupancy_report' | 'revenue_report';
type ReportFrequency = 'daily' | 'weekly' | 'monthly';

interface CacheData {
    payments: {
        transactions: PaymentTransaction[];
        totalAmount: number;
        lastUpdated: Date;
    };
    parking: {
        stats: ParkingStats;
        lastUpdated: Date;
    };
    performance: {
        metrics: PerformanceMetrics;
        lastUpdated: Date;
    };
}

interface ReportingIntegrationConfig {
    reportingSystem: ReportingSystem;
    paymentSystem: PaymentSystem;
    parkingManager: ParkingManager;
    performanceOptimizer: PerformanceOptimizer;
    updateInterval: number;
}

interface ReportingIntegrationEvent {
    type: 'data_updated' | 'report_generated' | 'report_scheduled' | 'report_failed';
    timestamp: Date;
    reportType: ReportType;
    dataSource?: keyof CacheData;
    details: Record<string, unknown>;
}

export class ReportingIntegration extends EventEmitter {
    private config: ReportingIntegrationConfig;
    private dataCache: Map<keyof CacheData, CacheData[keyof CacheData]>;
    private updateInterval!: NodeJS.Timeout;

    constructor(config: ReportingIntegrationConfig) {
        super();
        this.config = config;
        this.dataCache = new Map();
        this.initialize();
    }

    private initialize(): void {
        // Initialize cache with empty data
        this.dataCache.set('payments', {
            transactions: [],
            totalAmount: 0,
            lastUpdated: new Date()
        });

        this.dataCache.set('parking', {
            stats: this.config.parkingManager.getStats(),
            lastUpdated: new Date()
        });

        this.dataCache.set('performance', {
            metrics: {
                timestamp: new Date(),
                cpu: {
                    usage: 0,
                    cores: 0
                },
                memory: {
                    total: 0,
                    used: 0,
                    free: 0
                },
                database: {
                    connections: 0,
                    idleConnections: 0,
                    waitingConnections: 0
                },
                responseTime: {
                    average: 0,
                    max: 0,
                    min: 0
                },
                cache: {
                    hits: 0,
                    misses: 0,
                    keys: 0
                }
            },
            lastUpdated: new Date()
        });

        // Start periodic updates
        this.updateInterval = setInterval(() => {
            this.refreshCache();
        }, this.config.updateInterval);

        // Listen to events from other systems
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Payment system events
        this.config.paymentSystem.on('payment_completed', this.handlePaymentCompleted.bind(this));
        this.config.paymentSystem.on('payment_failed', this.handlePaymentFailed.bind(this));

        // Parking system events
        this.config.parkingManager.on('statsUpdated', this.handleParkingStatsUpdated.bind(this));

        // Performance events
        this.config.performanceOptimizer.on('metrics_collected', this.handlePerformanceMetrics.bind(this));
    }

    private async refreshCache(): Promise<void> {
        try {
            // Update payments data
            const paymentData = this.dataCache.get('payments') as CacheData['payments'];
            // Get all transactions for the current day
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            paymentData.transactions = await this.config.paymentSystem.getRecentTransactions(today);
            paymentData.totalAmount = paymentData.transactions.reduce((sum: number, t: PaymentTransaction) => sum + t.amount, 0);
            paymentData.lastUpdated = new Date();

            // Update parking data
            const parkingData = this.dataCache.get('parking') as CacheData['parking'];
            parkingData.stats = this.config.parkingManager.getStats();
            parkingData.lastUpdated = new Date();

            // Update performance data
            const performanceData = this.dataCache.get('performance') as CacheData['performance'];
            const metrics = await this.config.performanceOptimizer.getCurrentMetrics();
            performanceData.metrics = {
                timestamp: new Date(),
                cpu: metrics.cpu,
                memory: metrics.memory,
                database: metrics.database,
                responseTime: metrics.responseTime,
                cache: metrics.cache
            };
            performanceData.lastUpdated = new Date();

            this.emitEvent('data_updated', {
                dataSource: 'all',
                details: {
                    timestamp: new Date()
                }
            });
        } catch (error) {
            this.emitEvent('report_failed', {
                reportType: 'daily_summary',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    context: 'cache_refresh'
                }
            });
        }
    }

    private handlePaymentCompleted(transaction: PaymentTransaction): void {
        const paymentData = this.dataCache.get('payments') as CacheData['payments'];
        paymentData.transactions.push(transaction);
        paymentData.totalAmount += transaction.amount;
        paymentData.lastUpdated = new Date();

        this.emitEvent('data_updated', {
            dataSource: 'payments',
            details: {
                transactionId: transaction.id,
                amount: transaction.amount
            }
        });
    }

    private handlePaymentFailed(error: Error): void {
        this.emitEvent('report_failed', {
            reportType: 'payment_report',
            details: {
                error: error.message,
                context: 'payment_failed'
            }
        });
    }

    private handleParkingStatsUpdated(stats: ParkingStats): void {
        const parkingData = this.dataCache.get('parking')!;
        parkingData.stats = stats;
        parkingData.lastUpdated = new Date();

        this.emitEvent('data_updated', {
            dataSource: 'parking',
            details: {
                occupancyRate: stats.occupancyRate
            }
        });
    }

    private handlePerformanceMetrics(metrics: CacheData['performance']['metrics']): void {
        const performanceData = this.dataCache.get('performance')!;
        performanceData.metrics = metrics;
        performanceData.lastUpdated = new Date();

        this.emitEvent('data_updated', {
            dataSource: 'performance',
            details: {
                metrics
            }
        });
    }

    private isPaymentData(data: CacheData[keyof CacheData]): data is CacheData['payments'] {
        return 'transactions' in data && 'totalAmount' in data;
    }

    private isParkingData(data: CacheData[keyof CacheData]): data is CacheData['parking'] {
        return 'stats' in data;
    }

    private isPerformanceData(data: CacheData[keyof CacheData]): data is CacheData['performance'] {
        return 'metrics' in data && 'cpu' in data.metrics;
    }

    public async generateReport(
        reportType: ReportType,
        startDate: Date,
        endDate: Date,
        format: 'pdf' | 'excel' | 'csv'
    ): Promise<void> {
        try {
            const paymentsData = this.dataCache.get('payments') as CacheData['payments'];
            const parkingData = this.dataCache.get('parking') as CacheData['parking'];
            const performanceData = this.dataCache.get('performance') as CacheData['performance'];

            if (!paymentsData || !parkingData || !performanceData) {
                throw new Error('Cache data not initialized');
            }

            await this.config.reportingSystem.generateReport(reportType, {
                outputFormat: format,
                dateRange: { start: startDate, end: endDate },
                filters: {
                    payments: paymentsData.transactions,
                    parking: parkingData.stats,
                    performance: performanceData.metrics
                }
            });

            this.emitEvent('report_generated', {
                reportType,
                details: { startDate, endDate, format }
            });
        } catch (error) {
            this.emitEvent('report_failed', {
                reportType,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }

    public async scheduleReport(
        reportType: ReportType,
        schedule: string,
        recipients: string[]
    ): Promise<void> {
        try {
            // Validate recipients
            if (!Array.isArray(recipients) || recipients.length === 0) {
                throw new Error('Recipients must be a non-empty array');
            }

            // Validate schedule format
            const parts = schedule.split(' ');
            if (parts.length !== 2) {
                throw new Error(`Invalid schedule format: "${schedule}". Expected "frequency time" (e.g., "daily 09:00")`);
            }

            const [frequency, time] = parts;
            
            // Validate frequency
            if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
                throw new Error(`Invalid frequency: ${frequency}. Must be one of: daily, weekly, monthly`);
            }

            // Validate time format (HH:mm)
            if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
                throw new Error(`Invalid time format: ${time}. Must be in HH:mm format`);
            }

            // Create schedule with unique ID
            const scheduleId = `SCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const reportSchedule = {
                id: scheduleId,
                templateId: reportType,
                frequency: frequency as ReportFrequency,
                time,
                recipients,
                isActive: true
            };

            // Schedule the report
            await this.config.reportingSystem.scheduleReport(reportSchedule);

            this.emitEvent('report_scheduled', {
                reportType,
                details: {
                    scheduleId,
                    schedule,
                    recipients
                }
            });
        } catch (error) {
            this.emitEvent('report_failed', {
                reportType,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    schedule
                }
            });
            throw error;
        }
    }

    private emitEvent(type: ReportingIntegrationEvent['type'], details: Record<string, unknown>): void {
        const event: ReportingIntegrationEvent = {
            type,
            timestamp: new Date(),
            reportType: details.reportType as ReportType,
            dataSource: details.dataSource as keyof CacheData,
            details: {
                ...details,
                reportType: undefined,
                dataSource: undefined
            }
        };
        this.emit('reporting_integration_event', event);
    }

    public getDataCache(): Map<keyof CacheData, CacheData[keyof CacheData]> {
        return new Map(this.dataCache);
    }

    public dispose(): void {
        // Clear update interval
        clearInterval(this.updateInterval);
        // Clear data cache
        this.dataCache.clear();
    }
} 