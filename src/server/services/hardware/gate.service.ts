import { LoggerService } from '../logger.service';
import { AuditLog, EntityType, AuditAction } from '../../entities/AuditLog';

export class GateService {
    private static instance: GateService;
    private isOpen: boolean = false;
    private autoCloseTimeout?: NodeJS.Timeout;
    private isWindows: boolean;

    private constructor() {
        this.isWindows = process.platform === 'win32';
        LoggerService.info('Gate service initialized', { 
            platform: process.platform,
            context: 'GateService.constructor' 
        });
    }

    public static getInstance(): GateService {
        if (!GateService.instance) {
            GateService.instance = new GateService();
        }
        return GateService.instance;
    }

    public async open(userId?: number): Promise<void> {
        try {
            if (this.isOpen) {
                LoggerService.warn('Gate is already open', { context: 'GateService.open' });
                return;
            }

            // Simulate gate opening
            this.isOpen = true;
            LoggerService.info('Gate opened', { 
                userId, 
                platform: process.platform,
                context: 'GateService.open' 
            });

            // Log the action
            await AuditLog.log({
                action: AuditAction.GATE_OPEN,
                entityType: EntityType.GATE,
                userId,
                description: 'Gate barrier opened',
                ipAddress: '',
                userAgent: ''
            });

            // Auto close after 30 seconds
            this.autoCloseTimeout = setTimeout(() => {
                this.close(userId, true).catch(error => {
                    LoggerService.error('Failed to auto-close gate', { 
                        error, 
                        context: 'GateService.autoClose' 
                    });
                });
            }, 30000);
        } catch (error) {
            LoggerService.error('Failed to open gate', { 
                error, 
                context: 'GateService.open' 
            });
            throw new Error('Failed to open gate');
        }
    }

    public async close(userId?: number, isAutoClose: boolean = false): Promise<void> {
        try {
            if (!this.isOpen) {
                LoggerService.warn('Gate is already closed', { context: 'GateService.close' });
                return;
            }

            if (this.autoCloseTimeout) {
                clearTimeout(this.autoCloseTimeout);
                this.autoCloseTimeout = undefined;
            }

            // Simulate gate closing
            this.isOpen = false;
            LoggerService.info('Gate closed', { 
                userId, 
                isAutoClose, 
                platform: process.platform,
                context: 'GateService.close' 
            });

            // Log the action
            await AuditLog.log({
                action: AuditAction.GATE_CLOSE,
                entityType: EntityType.GATE,
                userId,
                description: `Gate barrier closed ${isAutoClose ? '(auto)' : ''}`,
                ipAddress: '',
                userAgent: ''
            });
        } catch (error) {
            LoggerService.error('Failed to close gate', { 
                error, 
                context: 'GateService.close' 
            });
            throw new Error('Failed to close gate');
        }
    }

    public async getStatus(): Promise<{ isOpen: boolean }> {
        try {
            return { isOpen: this.isOpen };
        } catch (error) {
            LoggerService.error('Failed to read gate status', { 
                error, 
                context: 'GateService.getStatus' 
            });
            throw new Error('Failed to read gate status');
        }
    }

    public async cleanup(): Promise<void> {
        try {
            if (this.autoCloseTimeout) {
                clearTimeout(this.autoCloseTimeout);
            }
            LoggerService.info('Gate service cleaned up', { 
                platform: process.platform,
                context: 'GateService.cleanup' 
            });
        } catch (error) {
            LoggerService.error('Failed to cleanup gate service', { 
                error, 
                context: 'GateService.cleanup' 
            });
            throw new Error('Failed to cleanup gate service');
        }
    }
} 