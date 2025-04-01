import { TestLogger } from './test-logger';

export class HardwareError extends Error {
    constructor(
        message: string,
        public readonly component: string,
        public readonly code: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'HardwareError';
    }
}

export class ErrorHandler {
    constructor(
        private readonly logger: TestLogger,
        private readonly maxRetries: number = 3,
        private readonly retryDelay: number = 1000
    ) {}

    async withRetry<T>(
        operation: () => Promise<T>,
        component: string,
        errorCode: string,
        context: string
    ): Promise<T> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                
                if (attempt < this.maxRetries) {
                    this.logger.log(
                        `Attempt ${attempt} failed for ${component} ${context}. Retrying...`,
                        'warn'
                    );
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                    continue;
                }
                
                this.handleError(
                    new HardwareError(
                        `Failed after ${this.maxRetries} attempts: ${lastError.message}`,
                        component,
                        errorCode,
                        { context, attempts: attempt }
                    )
                );
                throw lastError;
            }
        }

        throw lastError;
    }

    handleError(error: HardwareError): void {
        this.logger.logError(error.component, error);
        
        // Log detailed error information
        this.logger.log(
            `Error Code: ${error.code}`,
            'debug'
        );
        
        if (error.details) {
            this.logger.log(
                `Error Details: ${JSON.stringify(error.details, null, 2)}`,
                'debug'
            );
        }

        // Log component-specific error handling steps
        this.logComponentErrorHandling(error);
    }

    private logComponentErrorHandling(error: HardwareError): void {
        const handlingSteps = this.getComponentErrorHandlingSteps(error.component);
        if (handlingSteps) {
            this.logger.log('Recommended Error Handling Steps:', 'info');
            handlingSteps.forEach(step => {
                this.logger.log(`  - ${step}`, 'info');
            });
        }
    }

    private getComponentErrorHandlingSteps(component: string): string[] | null {
        const steps: Record<string, string[]> = {
            camera: [
                'Check USB connection and power',
                'Verify camera permissions',
                'Check camera driver installation',
                'Verify camera resolution settings',
                'Test camera with different USB port'
            ],
            printer: [
                'Check serial connection',
                'Verify printer power supply',
                'Check paper supply and alignment',
                'Verify printer settings',
                'Test printer with different baud rate'
            ],
            gate: [
                'Check power supply',
                'Verify control signals',
                'Check safety sensors',
                'Verify gate alignment',
                'Test emergency stop functionality'
            ],
            scanner: [
                'Check USB connection',
                'Verify scanner settings',
                'Check barcode format',
                'Verify scan distance',
                'Test scanner with different barcodes'
            ],
            trigger: [
                'Check GPIO connection',
                'Verify button wiring',
                'Check debounce settings',
                'Verify ground connection',
                'Test trigger with different timing'
            ],
            database: [
                'Check network connection',
                'Verify database credentials',
                'Check database service status',
                'Verify table structure',
                'Test connection pool settings'
            ]
        };

        return steps[component] || null;
    }
} 