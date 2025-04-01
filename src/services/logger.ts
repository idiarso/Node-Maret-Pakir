import * as fs from 'fs';
import * as path from 'path';

export class Logger {
    private logStream: fs.WriteStream | null = null;
    private startTime: Date;

    constructor(
        private readonly logFile: string = 'test-results.log',
        private readonly saveLogs: boolean = true
    ) {
        this.startTime = new Date();
        if (this.saveLogs) {
            this.initializeLogFile();
        }
    }

    private initializeLogFile(): void {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
        this.log(`Test session started at ${this.startTime.toISOString()}`);
    }

    log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

        // Console output based on log level
        switch (level) {
            case 'error':
                console.error(message);
                break;
            case 'warn':
                console.warn(message);
                break;
            case 'debug':
                console.debug(message);
                break;
            default:
                console.log(message);
        }

        // File output
        if (this.logStream) {
            this.logStream.write(logMessage);
        }
    }

    logTestResult(component: string, passed: boolean, details?: string[]): void {
        const status = passed ? 'PASSED' : 'FAILED';
        this.log(`${component} test ${status}`, passed ? 'info' : 'error');
        
        if (details) {
            details.forEach(detail => {
                this.log(`  ${detail}`, 'debug');
            });
        }
    }

    logError(component: string, error: Error): void {
        this.log(`Error in ${component}: ${error.message}`, 'error');
        if (error.stack) {
            this.log(error.stack, 'debug');
        }
    }

    logPerformance(component: string, duration: number): void {
        this.log(`${component} test completed in ${duration}ms`, 'debug');
    }

    logSummary(results: Map<string, boolean>, errors: Map<string, string>): void {
        const endTime = new Date();
        const duration = endTime.getTime() - this.startTime.getTime();

        this.log('\n=== Test Summary ===');
        this.log(`Total Duration: ${duration}ms`);
        this.log('-------------------');

        let allPassed = true;
        for (const [component, passed] of results) {
            const status = passed ? 'PASSED' : 'FAILED';
            this.log(`${component.padEnd(10)}: ${status}`);
            
            if (!passed) {
                allPassed = false;
                const error = errors.get(component);
                if (error) {
                    this.log(`  Error: ${error}`, 'error');
                }
            }
        }

        this.log('\n-------------------');
        this.log(`Overall Status: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    }

    dispose(): void {
        if (this.logStream) {
            this.logStream.end();
            this.logStream = null;
        }
    }
} 