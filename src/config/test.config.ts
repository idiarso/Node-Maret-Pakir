export interface TestConfig {
    camera: {
        resolutions: Array<{
            width: number;
            height: number;
        }>;
        testDuration: number;
        saveTestImages: boolean;
        imageQuality: number;
    };
    printer: {
        testTickets: Array<{
            barcode: string;
            plateNumber: string;
            vehicleType: string;
        }>;
        printDelay: number;
        retryAttempts: number;
    };
    gate: {
        openDuration: number;
        safetyCheckDelay: number;
        retryAttempts: number;
    };
    scanner: {
        timeout: number;
        testBarcodes: string[];
        retryAttempts: number;
    };
    trigger: {
        debounceTime: number;
        testDuration: number;
        retryAttempts: number;
    };
    database: {
        testData: {
            vehicleTypes: string[];
            operators: string[];
        };
        transactionTimeout: number;
        retryAttempts: number;
    };
    integration: {
        entryTestDelay: number;
        exitTestDelay: number;
        retryAttempts: number;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        saveLogs: boolean;
        logFile: string;
    };
}

export const defaultTestConfig: TestConfig = {
    camera: {
        resolutions: [
            { width: 1920, height: 1080 },
            { width: 1280, height: 720 },
            { width: 640, height: 480 }
        ],
        testDuration: 5000,
        saveTestImages: true,
        imageQuality: 90
    },
    printer: {
        testTickets: [
            {
                barcode: 'TEST123',
                plateNumber: 'TEST123',
                vehicleType: 'car'
            },
            {
                barcode: 'TEST456',
                plateNumber: 'TEST456',
                vehicleType: 'motorcycle'
            }
        ],
        printDelay: 1000,
        retryAttempts: 3
    },
    gate: {
        openDuration: 2000,
        safetyCheckDelay: 500,
        retryAttempts: 3
    },
    scanner: {
        timeout: 10000,
        testBarcodes: ['TEST123', 'TEST456', 'TEST789'],
        retryAttempts: 3
    },
    trigger: {
        debounceTime: 1000,
        testDuration: 10000,
        retryAttempts: 3
    },
    database: {
        testData: {
            vehicleTypes: ['car', 'motorcycle', 'truck'],
            operators: ['TEST', 'ADMIN']
        },
        transactionTimeout: 5000,
        retryAttempts: 3
    },
    integration: {
        entryTestDelay: 2000,
        exitTestDelay: 2000,
        retryAttempts: 3
    },
    logging: {
        level: 'info',
        saveLogs: true,
        logFile: 'test-results.log'
    }
}; 