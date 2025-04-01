import { PaymentSystem } from '../payment/payment.interface';
import { ParkingManager } from '../parking/parking.manager';
import { SecurityManager } from '../security/security.manager';
import { ReportingSystem } from '../reporting/report.interface';
import { PerformanceOptimizer } from '../performance/performance.optimizer';
import { PaymentParkingIntegration } from './payment-parking.integration';
import { SecurityIntegration } from './security.integration';
import { ReportingIntegration } from './reporting.integration';

interface IntegrationConfig {
    paymentSystem: PaymentSystem;
    parkingManager: ParkingManager;
    securityManager: SecurityManager;
    reportingSystem: ReportingSystem;
    performanceOptimizer: PerformanceOptimizer;
    updateInterval: number;
}

export class SystemIntegration {
    private paymentParkingIntegration!: PaymentParkingIntegration;
    private securityIntegration!: SecurityIntegration;
    private reportingIntegration!: ReportingIntegration;

    constructor(private config: IntegrationConfig) {
        this.initializeIntegrations();
    }

    private initializeIntegrations(): void {
        // Initialize payment-parking integration
        this.paymentParkingIntegration = new PaymentParkingIntegration({
            paymentSystem: this.config.paymentSystem,
            parkingManager: this.config.parkingManager,
            autoOpenGate: true,
            requireConfirmation: false
        });

        // Initialize security integration
        this.securityIntegration = new SecurityIntegration({
            securityManager: this.config.securityManager,
            paymentSystem: this.config.paymentSystem,
            parkingManager: this.config.parkingManager,
            reportingSystem: this.config.reportingSystem
        });

        // Initialize reporting integration
        this.reportingIntegration = new ReportingIntegration({
            reportingSystem: this.config.reportingSystem,
            paymentSystem: this.config.paymentSystem,
            parkingManager: this.config.parkingManager,
            performanceOptimizer: this.config.performanceOptimizer,
            updateInterval: this.config.updateInterval
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Payment-Parking events
        this.paymentParkingIntegration.on('integration_event', (event) => {
            console.log('Payment-Parking Integration Event:', event);
            // Handle payment-parking events
        });

        // Security events
        this.securityIntegration.on('security_integration_event', (event) => {
            console.log('Security Integration Event:', event);
            // Handle security events
        });

        // Reporting events
        this.reportingIntegration.on('reporting_integration_event', (event) => {
            console.log('Reporting Integration Event:', event);
            // Handle reporting events
        });
    }

    public getPaymentParkingIntegration(): PaymentParkingIntegration {
        return this.paymentParkingIntegration;
    }

    public getSecurityIntegration(): SecurityIntegration {
        return this.securityIntegration;
    }

    public getReportingIntegration(): ReportingIntegration {
        return this.reportingIntegration;
    }

    public dispose(): void {
        // Clean up all integrations
        this.paymentParkingIntegration.dispose();
        this.securityIntegration.dispose();
        this.reportingIntegration.dispose();
    }
} 