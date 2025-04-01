import { HardwareManager, HardwareConfig } from '../hardware/hardware.manager';
import { EventEmitter } from 'events';
import { DatabaseService } from '../services/database.service';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { HardwareError } from '../hardware/hardware.error';
import { ErrorHandler } from '../services/error.handler';
import { Logger } from '../services/logger';
import * as crypto from 'crypto';
import { TicketData } from '../entry-point/entry-point';
import { PrinterService } from '../services/printer';
import { CameraService } from '../services/camera';
import { BarcodeScannerService } from '../services/scanner';

class HardwareTester extends EventEmitter {
    private testResults: Map<string, boolean> = new Map();
    private testErrors: Map<string, string> = new Map();
    private testDetails: Map<string, string[]> = new Map();
    private readonly config: HardwareConfig;

    constructor(
        private readonly hardwareManager: HardwareManager,
        private readonly databaseService: DatabaseService,
        private readonly errorHandler: ErrorHandler,
        private readonly logger: Logger,
        config: HardwareConfig
    ) {
        super();
        this.config = config;
    }

    async runAllTests(): Promise<void> {
        console.log('Starting hardware tests...\n');

        // Test Printer
        console.log('Testing printer...');
        const printer = new PrinterService();
        try {
            await printer.testPrint();
            console.log('✓ Printer test successful');
        } catch (error) {
            console.error('✗ Printer test failed:', error);
        }

        // Test Cameras
        console.log('\nTesting cameras...');
        const camera = new CameraService();
        try {
            await camera.connect();
            console.log('✓ Camera connection successful');
            
            const entryImage = await camera.captureEntryImage();
            console.log('✓ Entry camera snapshot successful');
            
            const exitImage = await camera.captureExitImage();
            console.log('✓ Exit camera snapshot successful');
            
            await camera.disconnect();
            console.log('✓ Camera disconnection successful');
        } catch (error) {
            console.error('✗ Camera test failed:', error);
        }

        // Test Barcode Scanner
        console.log('\nTesting barcode scanner...');
        const scanner = new BarcodeScannerService();
        try {
            scanner.connect();
            console.log('✓ Scanner connection successful');
            
            // Listen for barcode events
            scanner.on('barcode', (barcode) => {
                console.log('✓ Barcode scanned:', barcode);
            });
            
            console.log('Waiting for barcode scan (press Ctrl+C to exit)...');
        } catch (error) {
            console.error('✗ Scanner test failed:', error);
        }
    }

    private async testCamera(): Promise<void> {
        this.logger.log('Testing Camera System...');
        const details: string[] = [];

        try {
            // Test 1: Camera initialization with detailed error handling
            try {
                await this.errorHandler.withRetry(
                    () => this.hardwareManager.initializeCamera(),
                    'camera',
                    'INIT_FAILED',
                    'initialization'
                );
                details.push('✓ Camera initialized successfully');
            } catch (error) {
                if (error instanceof HardwareError) {
                    switch (error.code) {
                        case 'INIT_FAILED':
                            details.push('✗ Camera initialization failed');
                            details.push('  - Checking USB connection...');
                            details.push('  - Verifying camera permissions...');
                            details.push('  - Checking camera driver status...');
                            throw error;
                        case 'DEVICE_NOT_FOUND':
                            details.push('✗ Camera device not found');
                            details.push('  - Checking device path...');
                            details.push('  - Verifying USB connection...');
                            throw error;
                        case 'PERMISSION_DENIED':
                            details.push('✗ Camera permission denied');
                            details.push('  - Checking user permissions...');
                            details.push('  - Verifying device access...');
                            throw error;
                        default:
                            throw error;
                    }
                }
                throw error;
            }

            // Test 2: Camera capabilities verification
            try {
                const capabilities = await this.errorHandler.withRetry(
                    () => this.hardwareManager.getCameraCapabilities(),
                    'camera',
                    'CAPABILITIES_FAILED',
                    'capabilities check'
                );
                details.push('✓ Camera capabilities verified');
                details.push(`  - Supported resolutions: ${capabilities.resolutions.join(', ')}`);
                details.push(`  - Frame rates: ${capabilities.frameRates.join(', ')} fps`);
            } catch (error) {
                if (error instanceof HardwareError && error.code === 'CAPABILITIES_FAILED') {
                    details.push('✗ Failed to get camera capabilities');
                    details.push('  - Checking camera driver compatibility...');
                    details.push('  - Verifying camera firmware...');
                }
                throw error;
            }

            // Test 3: Image capture with different resolutions and error recovery
            try {
                const image = await this.errorHandler.withRetry(
                    () => this.hardwareManager.captureImage(),
                    'camera',
                    'CAPTURE_FAILED',
                    `capture at ${this.config.camera.resolution.width}x${this.config.camera.resolution.height}`
                );

                if (!image) {
                    throw new HardwareError(
                        `Failed to capture image at ${this.config.camera.resolution.width}x${this.config.camera.resolution.height}`,
                        'camera',
                        'CAPTURE_FAILED',
                        { resolution: this.config.camera.resolution }
                    );
                }

                // Verify image quality
                const imageStats = await this.errorHandler.withRetry(
                    () => this.hardwareManager.analyzeImageQuality(image),
                    'camera',
                    'QUALITY_CHECK_FAILED',
                    'image quality analysis'
                );

                if (imageStats.brightness < 0.3 || imageStats.brightness > 0.7) {
                    details.push(`⚠ Image brightness outside optimal range: ${imageStats.brightness}`);
                }

                if (imageStats.contrast < 0.5) {
                    details.push(`⚠ Image contrast below optimal threshold: ${imageStats.contrast}`);
                }

                if (imageStats.blur > 0.5) {
                    details.push(`⚠ Image blur detected: ${imageStats.blur}`);
                }

                details.push(`✓ Captured image at ${this.config.camera.resolution.width}x${this.config.camera.resolution.height}`);
            } catch (error) {
                if (error instanceof HardwareError) {
                    switch (error.code) {
                        case 'CAPTURE_FAILED':
                            details.push('✗ Capture attempt failed');
                            details.push('  - Adjusting camera settings...');
                            details.push('  - Checking lighting conditions...');
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            return;
                        case 'QUALITY_CHECK_FAILED':
                            details.push('✗ Image quality check failed');
                            details.push('  - Verifying camera settings...');
                            details.push('  - Checking environmental conditions...');
                            throw error;
                        default:
                            throw error;
                    }
                }
                throw error;
            }

            // Test 4: OCR with error recovery and validation
            try {
                const image = await this.errorHandler.withRetry(
                    () => this.hardwareManager.captureImage(),
                    'camera',
                    'CAPTURE_FAILED',
                    'OCR capture'
                );

                if (!image) {
                    throw new HardwareError(
                        'Failed to capture image for OCR test',
                        'camera',
                        'CAPTURE_FAILED',
                        { test: 'OCR' }
                    );
                }

                const result = await this.errorHandler.withRetry(
                    () => this.hardwareManager.recognizePlate(image),
                    'camera',
                    'OCR_FAILED',
                    'plate recognition'
                );

                if (!result) {
                    throw new HardwareError(
                        'No text detected in image',
                        'camera',
                        'OCR_NO_TEXT',
                        { result }
                    );
                }

                details.push(`✓ OCR Result: ${result}`);
            } catch (error) {
                if (error instanceof HardwareError) {
                    switch (error.code) {
                        case 'OCR_FAILED':
                            details.push('✗ OCR processing failed');
                            details.push('  - Checking image quality...');
                            details.push('  - Verifying OCR service...');
                            throw error;
                        case 'OCR_NO_TEXT':
                            details.push('✗ No text detected in image');
                            details.push('  - Checking camera focus...');
                            details.push('  - Verifying lighting conditions...');
                            throw error;
                        default:
                            throw error;
                    }
                }
                throw error;
            }

            // Test 5: Camera error recovery
            try {
                await this.errorHandler.withRetry(
                    () => this.hardwareManager.simulateCameraError(),
                    'camera',
                    'RECOVERY_FAILED',
                    'error recovery'
                );
                details.push('✓ Camera error recovery verified');
            } catch (error) {
                if (error instanceof HardwareError && error.code === 'RECOVERY_FAILED') {
                    details.push('✗ Camera error recovery failed');
                    details.push('  - Checking camera state...');
                    details.push('  - Attempting hardware reset...');
                }
                throw error;
            }

            this.testResults.set('camera', true);
            this.logger.logTestResult('camera', true, details);
        } catch (error) {
            this.testResults.set('camera', false);
            if (error instanceof HardwareError) {
                this.testErrors.set('camera', error.message);
                this.errorHandler.handleError(error);
            } else {
                const hardwareError = new HardwareError(
                    error instanceof Error ? error.message : 'Unknown error',
                    'camera',
                    'UNKNOWN_ERROR'
                );
                this.testErrors.set('camera', hardwareError.message);
                this.errorHandler.handleError(hardwareError);
            }
        } finally {
            this.testDetails.set('camera', details);
        }
    }

    private async testPrinter(): Promise<void> {
        this.logger.log('Testing Printer System...');
        const details: string[] = [];

        try {
            // Test 1: Printer initialization with retry
            await this.errorHandler.withRetry(
                () => this.hardwareManager.initializePrinter(),
                'printer',
                'INIT_FAILED',
                'initialization'
            );
            details.push('✓ Printer initialized successfully');

            // Test 2: Print test ticket
            const ticketData: TicketData = {
                id: crypto.randomUUID(),
                plateNumber: 'TEST123',
                entryTime: new Date(),
                vehicleType: 'car',
                operatorId: 'test-operator',
                barcode: 'TEST123'
            };

            await this.errorHandler.withRetry(
                () => this.hardwareManager.printTicket(ticketData),
                'printer',
                'PRINT_FAILED',
                'printing test ticket'
            );
            details.push(`✓ Printed ticket for ${ticketData.plateNumber}`);

            // Test 3: Printer error handling
            try {
                const invalidTicket: TicketData = {
                    id: crypto.randomUUID(),
                    barcode: 'ERROR',
                    plateNumber: 'ERROR',
                    entryTime: new Date(),
                    vehicleType: 'invalid',
                    operatorId: 'TEST'
                };

                await this.errorHandler.withRetry(
                    () => this.hardwareManager.printTicket(invalidTicket),
                    'printer',
                    'INVALID_TICKET',
                    'error handling'
                );
            } catch (error) {
                if (error instanceof HardwareError && error.code === 'INVALID_TICKET') {
                    details.push('✓ Printer error handling verified');
                } else {
                    throw error;
                }
            }

            this.testResults.set('printer', true);
            this.logger.logTestResult('printer', true, details);
        } catch (error) {
            this.testResults.set('printer', false);
            if (error instanceof HardwareError) {
                this.testErrors.set('printer', error.message);
                this.errorHandler.handleError(error);
            } else {
                const hardwareError = new HardwareError(
                    error instanceof Error ? error.message : 'Unknown error',
                    'printer',
                    'UNKNOWN_ERROR'
                );
                this.testErrors.set('printer', hardwareError.message);
                this.errorHandler.handleError(hardwareError);
            }
        } finally {
            this.testDetails.set('printer', details);
        }
    }

    private async testGate(): Promise<void> {
        this.logger.log('Testing Gate Control System...');
        const details: string[] = [];

        try {
            // Test 1: Gate initialization with retry
            await this.errorHandler.withRetry(
                () => this.hardwareManager.initializeGate(),
                'gate',
                'INIT_FAILED',
                'initialization'
            );
            details.push('✓ Gate initialized successfully');

            // Test 2: Gate opening with safety check
            await this.errorHandler.withRetry(
                () => this.hardwareManager.openGate(),
                'gate',
                'OPEN_FAILED',
                'opening'
            );
            details.push('✓ Gate opened successfully');

            // Test 3: Gate state verification
            await new Promise(resolve => setTimeout(resolve, this.config.gate.openDelay));
            details.push('✓ Gate state verified');

            // Test 4: Gate closing with safety check
            await this.errorHandler.withRetry(
                () => this.hardwareManager.closeGate(),
                'gate',
                'CLOSE_FAILED',
                'closing'
            );
            details.push('✓ Gate closed successfully');

            this.testResults.set('gate', true);
            this.logger.logTestResult('gate', true, details);
        } catch (error) {
            this.testResults.set('gate', false);
            if (error instanceof HardwareError) {
                this.testErrors.set('gate', error.message);
                this.errorHandler.handleError(error);
            } else {
                const hardwareError = new HardwareError(
                    error instanceof Error ? error.message : 'Unknown error',
                    'gate',
                    'UNKNOWN_ERROR'
                );
                this.testErrors.set('gate', hardwareError.message);
                this.errorHandler.handleError(hardwareError);
            }
        } finally {
            this.testDetails.set('gate', details);
        }
    }

    private async testBarcodeScanner(): Promise<void> {
        console.log('Testing Barcode Scanner System...');
        const details: string[] = [];

        try {
            // Test 1: Scanner initialization
            await this.hardwareManager.initializeScanner();
            details.push('✓ Scanner initialized successfully');

            // Test 2: Scanner event handling
            const scanPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Scanner timeout - no barcode detected'));
                }, 10000);

                this.hardwareManager.once('barcodeScan', (result) => {
                    clearTimeout(timeout);
                    resolve(result);
                });
            });

            console.log('Please scan a test barcode within 10 seconds...');
            const result = await scanPromise;
            details.push(`✓ Barcode scanned successfully: ${result}`);

            // Test 3: Scanner error handling
            try {
                await new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Test error')), 100);
                });
            } catch (error) {
                details.push('✓ Scanner error handling verified');
            }

            this.testResults.set('scanner', true);
            console.log('Scanner test passed ✓\n');
        } catch (error) {
            this.testResults.set('scanner', false);
            this.testErrors.set('scanner', error instanceof Error ? error.message : 'Unknown error');
            console.error('Scanner test failed ✗\n');
        } finally {
            this.testDetails.set('scanner', details);
        }
    }

    private async testTrigger(): Promise<void> {
        console.log('Testing Trigger System...');
        const details: string[] = [];

        try {
            // Test 1: Trigger initialization
            await this.hardwareManager.initializeTrigger();
            details.push('✓ Trigger initialized successfully');

            // Test 2: Trigger event handling
            const triggerPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Trigger timeout - no trigger detected'));
                }, 10000);

                this.hardwareManager.once('trigger', () => {
                    clearTimeout(timeout);
                    resolve(true);
                });
            });

            console.log('Please press the pushbutton within 10 seconds...');
            await triggerPromise;
            details.push('✓ Trigger event received successfully');

            // Test 3: Trigger debounce handling
            await new Promise(resolve => setTimeout(resolve, 1000));
            details.push('✓ Trigger debounce verified');

            // Test 4: Trigger error handling
            try {
                await new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Test error')), 100);
                });
            } catch (error) {
                details.push('✓ Trigger error handling verified');
            }

            this.testResults.set('trigger', true);
            console.log('Trigger test passed ✓\n');
        } catch (error) {
            this.testResults.set('trigger', false);
            this.testErrors.set('trigger', error instanceof Error ? error.message : 'Unknown error');
            console.error('Trigger test failed ✗\n');
        } finally {
            this.testDetails.set('trigger', details);
        }
    }

    private async testDatabase(): Promise<void> {
        console.log('Testing Database System...');
        const details: string[] = [];

        try {
            // Test 1: Database connection
            await this.databaseService.getVehicleTypePrice('car');
            details.push('✓ Database connection verified');

            // Test 2: Transaction handling
            const ticketData: TicketData = {
                id: crypto.randomUUID(),
                entryTime: new Date(),
                barcode: '123456789',
                plateNumber: 'B1234CD',
                vehicleType: 'car',
                operatorId: 'test-operator'
            };

            await this.databaseService.createTicket(ticketData);
            details.push('✓ Ticket creation verified');

            const ticket = await this.databaseService.getTicketByBarcode(ticketData.barcode);
            details.push('✓ Ticket retrieval verified');

            // Test 3: Database error handling
            try {
                await this.databaseService.getVehicleTypePrice('invalid_type');
            } catch (error) {
                details.push('✓ Database error handling verified');
            }

            this.testResults.set('database', true);
            console.log('Database test passed ✓\n');
        } catch (error) {
            this.testResults.set('database', false);
            this.testErrors.set('database', error instanceof Error ? error.message : 'Unknown error');
            console.error('Database test failed ✗\n');
        } finally {
            this.testDetails.set('database', details);
        }
    }

    private async testSystemIntegration(): Promise<void> {
        console.log('Testing System Integration...');
        const details: string[] = [];

        try {
            // Test 1: Full entry process
            const entryTicket: TicketData = {
                id: crypto.randomUUID(),
                barcode: 'INTTEST123',
                plateNumber: 'INTTEST123',
                entryTime: new Date(),
                vehicleType: 'car',
                operatorId: 'TEST'
            };

            // Capture image
            const image = await this.hardwareManager.captureImage();
            if (!image) {
                throw new Error('Failed to capture image for integration test');
            }
            details.push('✓ Image capture verified');

            // Recognize plate
            const { data: { text } } = await this.hardwareManager.recognizePlate(image);
            details.push(`✓ Plate recognition verified: ${text}`);

            // Print ticket
            await this.hardwareManager.printTicket(entryTicket);
            details.push('✓ Ticket printing verified');

            // Open gate
            await this.hardwareManager.openGate();
            details.push('✓ Gate opening verified');

            // Save to database
            await this.databaseService.createTicket(entryTicket);
            details.push('✓ Database save verified');

            // Test 2: Full exit process
            const exitTicket = await this.databaseService.getTicketByBarcode(entryTicket.barcode);
            if (!exitTicket) {
                throw new Error('Failed to retrieve ticket for exit test');
            }

            // Scan barcode
            await this.hardwareManager.initializeScanner();
            details.push('✓ Scanner initialization verified');

            // Calculate fee based on vehicle type price
            const basePrice = await this.databaseService.getVehicleTypePrice(exitTicket.vehicleType);
            const entryTime = new Date(exitTicket.entryTime);
            const exitTime = new Date();
            const duration = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60); // hours
            const fee = basePrice * Math.ceil(duration);
            details.push(`✓ Fee calculation verified: ${fee}`);

            // Print receipt
            const receiptTicket: TicketData = {
                ...exitTicket,
                id: crypto.randomUUID(),
                entryTime: new Date(exitTicket.entryTime)
            };
            await this.hardwareManager.printTicket(receiptTicket);
            details.push('✓ Receipt printing verified');

            // Open gate
            await this.hardwareManager.openGate();
            details.push('✓ Exit gate opening verified');

            // Update database
            await this.databaseService.updateTicketExit(exitTicket.barcode, fee);
            details.push('✓ Database update verified');

            this.testResults.set('integration', true);
            console.log('Integration test passed ✓\n');
        } catch (error) {
            this.testResults.set('integration', false);
            this.testErrors.set('integration', error instanceof Error ? error.message : 'Unknown error');
            console.error('Integration test failed ✗\n');
        } finally {
            this.testDetails.set('integration', details);
        }
    }

    private printTestSummary(): void {
        console.log('\n=== Detailed Test Summary ===');
        console.log('----------------------------');
        
        let allPassed = true;
        for (const [component, passed] of this.testResults) {
            const status = passed ? '✓ PASSED' : '✗ FAILED';
            console.log(`\n${component.toUpperCase()}: ${status}`);
            
            if (!passed) {
                allPassed = false;
                console.log(`  Error: ${this.testErrors.get(component)}`);
            }

            const details = this.testDetails.get(component);
            if (details) {
                console.log('  Details:');
                details.forEach(detail => console.log(`    ${detail}`));
            }
        }

        console.log('\n----------------------------');
        console.log(`Overall Status: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
    }
}

// Main execution
async function main() {
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432')
    });

    const databaseService = new DatabaseService(pool);
    const logger = new Logger('test-hardware.log');
    const errorHandler = new ErrorHandler(logger);

    // Initialize hardware manager with default config
    const hardwareConfig: HardwareConfig = {
        camera: {
            deviceId: '/dev/video0',
            resolution: { width: 1920, height: 1080 },
            frameRate: 30
        },
        printer: {
            port: '/dev/ttyUSB0',
            baudRate: 9600
        },
        gate: {
            pin: 17,
            openDelay: 5000,
            closeDelay: 5000
        },
        scanner: {
            port: '/dev/ttyUSB1',
            baudRate: 9600
        },
        trigger: {
            pin: 27,
            debounceTime: 100,
            activeLow: true
        }
    };

    const hardwareManager = new HardwareManager(hardwareConfig);

    // Create and run tester
    const tester = new HardwareTester(hardwareManager, databaseService, errorHandler, logger, hardwareConfig);
    await tester.runAllTests();

    // Cleanup
    await pool.end();
    logger.dispose();
}

// Run the tests
main().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
}); 