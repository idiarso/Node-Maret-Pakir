import { EventEmitter } from 'events';
import { SecurityManager } from '../security/security.manager';
import { PaymentSystem } from '../payment/payment.interface';
import { ParkingManager } from '../parking/parking.manager';
import { ReportingSystem } from '../reporting/report.interface';

interface SecurityIntegrationConfig {
    securityManager: SecurityManager;
    paymentSystem: PaymentSystem;
    parkingManager: ParkingManager;
    reportingSystem: ReportingSystem;
}

interface SecurityIntegrationEvent {
    type: 'auth_required' | 'auth_success' | 'auth_failed' | 'permission_denied' | 'session_expired';
    timestamp: Date;
    userId?: string;
    system: 'payment' | 'parking' | 'reporting';
    details: Record<string, unknown>;
}

export class SecurityIntegration extends EventEmitter {
    private config: SecurityIntegrationConfig;
    private activeSessions: Map<string, {
        userId: string;
        token: string;
        system: string;
        expiresAt: Date;
    }>;

    constructor(config: SecurityIntegrationConfig) {
        super();
        this.config = config;
        this.activeSessions = new Map();
        this.initialize();
    }

    private initialize(): void {
        // Listen to security events
        this.config.securityManager.on('security_event', this.handleSecurityEvent.bind(this));

        // Initialize system-specific security
        this.initializePaymentSecurity();
        this.initializeParkingSecurity();
        this.initializeReportingSecurity();
    }

    private initializePaymentSecurity(): void {
        // Add security middleware to payment system
        this.config.paymentSystem.on('before_payment', async (data: any) => {
            const { token, ...paymentData } = data;
            const session = await this.validateSession(token, 'payment');
            if (!session) {
                throw new Error('Unauthorized');
            }
            return { ...paymentData, userId: session.userId };
        });
    }

    private initializeParkingSecurity(): void {
        // Add security middleware to parking system
        this.config.parkingManager.on('before_space_assignment', async (data: any) => {
            const { token, ...parkingData } = data;
            const session = await this.validateSession(token, 'parking');
            if (!session) {
                throw new Error('Unauthorized');
            }
            return { ...parkingData, userId: session.userId };
        });
    }

    private initializeReportingSecurity(): void {
        // Add security middleware to reporting system
        this.config.reportingSystem.on('before_report_generation', async (data: any) => {
            const { token, ...reportData } = data;
            const session = await this.validateSession(token, 'reporting');
            if (!session) {
                throw new Error('Unauthorized');
            }
            return { ...reportData, userId: session.userId };
        });
    }

    public async authenticateUser(
        username: string,
        password: string,
        system: 'payment' | 'parking' | 'reporting'
    ): Promise<{ token: string; user: any }> {
        const { token, user } = await this.config.securityManager.login(username, password);

        // Create session
        const session = {
            userId: user.id,
            token,
            system,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

        this.activeSessions.set(token, session);

        this.emitEvent('auth_success', {
            userId: user.id,
            system,
            details: { username }
        });

        return { token, user };
    }

    public async validateSession(
        token: string,
        system: 'payment' | 'parking' | 'reporting'
    ): Promise<{ userId: string; token: string; system: string; expiresAt: Date } | null> {
        try {
            const user = await this.config.securityManager.validateToken(token);
            const session = this.activeSessions.get(token);

            if (!session || session.system !== system || new Date() > session.expiresAt) {
                this.emitEvent('session_expired', {
                    userId: user.id,
                    system,
                    details: { token }
                });
                return null;
            }

            return session;
        } catch (error) {
            this.emitEvent('auth_failed', {
                system,
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
            return null;
        }
    }

    public async checkPermission(
        userId: string,
        permission: string,
        system: 'payment' | 'parking' | 'reporting'
    ): Promise<boolean> {
        const hasPermission = await this.config.securityManager.checkPermission(userId, permission);
        
        if (!hasPermission) {
            this.emitEvent('permission_denied', {
                userId,
                system,
                details: { permission }
            });
        }

        return hasPermission;
    }

    private async handleSecurityEvent(event: any): Promise<void> {
        // Handle security events from security manager
        switch (event.type) {
            case 'login':
                // Update active sessions
                const session = this.activeSessions.get(event.details.token);
                if (session) {
                    session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                }
                break;
            case 'logout':
                // Remove session
                this.activeSessions.delete(event.details.token);
                break;
            case 'system_alert':
                // Handle system alerts
                this.emitEvent('auth_failed', {
                    system: 'all',
                    details: {
                        message: event.details.message,
                        severity: event.details.severity
                    }
                });
                break;
        }
    }

    private emitEvent(type: SecurityIntegrationEvent['type'], details: Record<string, unknown>): void {
        const event: SecurityIntegrationEvent = {
            type,
            timestamp: new Date(),
            system: details.system as 'payment' | 'parking' | 'reporting',
            userId: details.userId as string,
            details: {
                ...details,
                system: undefined,
                userId: undefined
            }
        };
        this.emit('security_integration_event', event);
    }

    public getActiveSessions(): Map<string, {
        userId: string;
        token: string;
        system: string;
        expiresAt: Date;
    }> {
        return new Map(this.activeSessions);
    }

    public dispose(): void {
        // Clean up active sessions
        this.activeSessions.clear();
    }
} 