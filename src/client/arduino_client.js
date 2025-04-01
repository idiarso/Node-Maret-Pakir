const SerialPort = require('serialport');
const { Logger } = require('../shared/services/Logger');
const logger = Logger.getInstance();

class ArduinoClient {
    constructor(port, baudRate = 9600) {
        this.port = port;
        this.baudRate = baudRate;
        this.serialPort = null;
        this.isConnected = false;
        this.config = {
            gateOpenTime: 5,
            buzzerVolume: 128,
            testMode: false,
            debugMode: false,
            scannerTimeout: 5000,
            gateTimeout: 10000,
            voltageThreshold: 4.5,
            autoRetry: true,
            maxRetries: 3
        };
        this.healthStatus = {
            lastCheck: null,
            status: 'UNKNOWN',
            errors: [],
            voltage: 0,
            memory: {
                free: 0,
                total: 0
            },
            uptime: 0
        };
        this.startTime = Date.now();
    }

    async connect() {
        try {
            this.serialPort = new SerialPort(this.port, {
                baudRate: this.baudRate,
                autoOpen: false
            });

            await new Promise((resolve, reject) => {
                this.serialPort.open((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.isConnected = true;
                        this.setupEventHandlers();
                        resolve();
                    }
                });
            });

            logger.info(`Connected to Arduino on port ${this.port}`);
            await this.loadConfig();
            return true;
        } catch (error) {
            logger.error(`Failed to connect to Arduino: ${error.message}`);
            return false;
        }
    }

    setupEventHandlers() {
        this.serialPort.on('data', (data) => {
            const message = data.toString().trim();
            
            if (message.startsWith('BARCODE:')) {
                const barcode = message.substring(8);
                this.handleBarcode(barcode);
            } else if (message.startsWith('ERROR:')) {
                const errorCode = parseInt(message.substring(6));
                this.handleError(errorCode);
            } else if (message.startsWith('STATUS:')) {
                const status = message.substring(7);
                this.handleStatus(status);
            } else if (message.startsWith('TEST:')) {
                const testResult = message.substring(5);
                this.handleTestResult(testResult);
            } else if (message.startsWith('VOLTAGE:')) {
                const voltage = parseFloat(message.substring(8));
                this.handleVoltage(voltage);
            } else if (message.startsWith('MEMORY:')) {
                const memory = message.substring(7).split(',');
                this.handleMemory(parseInt(memory[0]), parseInt(memory[1]));
            }
        });

        this.serialPort.on('error', (error) => {
            logger.error(`Arduino communication error: ${error.message}`);
            this.isConnected = false;
            this.healthStatus.status = 'ERROR';
            this.healthStatus.errors.push({
                type: 'COMMUNICATION_ERROR',
                message: error.message,
                timestamp: new Date()
            });
        });

        this.serialPort.on('close', () => {
            logger.info('Arduino connection closed');
            this.isConnected = false;
            this.healthStatus.status = 'DISCONNECTED';
        });
    }

    async loadConfig() {
        try {
            const response = await fetch('http://localhost:3000/api/devices/config');
            if (response.ok) {
                this.config = await response.json();
                await this.updateArduinoConfig();
            }
        } catch (error) {
            logger.error(`Failed to load configuration: ${error.message}`);
        }
    }

    async updateArduinoConfig() {
        if (!this.isConnected) return;

        const configString = JSON.stringify(this.config);
        this.serialPort.write(`CONFIG:${configString}\n`, (err) => {
            if (err) {
                logger.error(`Failed to update Arduino configuration: ${err.message}`);
            } else {
                logger.info('Arduino configuration updated');
            }
        });
    }

    handleBarcode(barcode) {
        logger.info(`Received barcode: ${barcode}`);
        this.sendToServer('tickets/scan', { barcode });
    }

    handleError(errorCode) {
        const errorTypes = {
            1: 'SCANNER_ERROR',
            2: 'GATE_ERROR',
            3: 'COMMUNICATION_ERROR',
            4: 'CONFIG_ERROR',
            5: 'VOLTAGE_ERROR',
            6: 'TIMEOUT_ERROR',
            7: 'HARDWARE_ERROR',
            8: 'MEMORY_ERROR'
        };

        const error = errorTypes[errorCode] || 'UNKNOWN_ERROR';
        logger.error(`Arduino error: ${error}`);
        
        this.healthStatus.errors.push({
            type: error,
            timestamp: new Date()
        });

        this.sendToServer('devices/error', { 
            type: error,
            timestamp: new Date(),
            uptime: this.getUptime()
        });
    }

    handleStatus(status) {
        logger.info(`Arduino status: ${status}`);
        
        if (status === 'HEALTH:OK') {
            this.healthStatus.status = 'OK';
            this.healthStatus.lastCheck = new Date();
            this.healthStatus.errors = [];
        } else if (status === 'CRITICAL_ERROR') {
            this.healthStatus.status = 'CRITICAL_ERROR';
            this.sendToServer('devices/status', { 
                status: 'CRITICAL_ERROR',
                uptime: this.getUptime()
            });
        }
    }

    handleTestResult(result) {
        logger.info(`Test result: ${result}`);
        this.sendToServer('devices/test', { 
            result,
            timestamp: new Date(),
            uptime: this.getUptime()
        });
    }

    handleVoltage(voltage) {
        this.healthStatus.voltage = voltage;
        if (voltage < this.config.voltageThreshold) {
            logger.warn(`Low voltage detected: ${voltage}V`);
        }
    }

    handleMemory(free, total) {
        this.healthStatus.memory = { free, total };
        const usagePercent = ((total - free) / total) * 100;
        if (usagePercent > 80) {
            logger.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
        }
    }

    getUptime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    async sendToServer(endpoint, data) {
        try {
            const response = await fetch(`http://localhost:3000/api/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const responseData = await response.json();
            logger.info(`Server response: ${JSON.stringify(responseData)}`);
        } catch (error) {
            logger.error(`Failed to send data to server: ${error.message}`);
        }
    }

    async getHealthStatus() {
        return {
            ...this.healthStatus,
            isConnected: this.isConnected,
            config: this.config,
            uptime: this.getUptime()
        };
    }

    async disconnect() {
        if (this.serialPort && this.isConnected) {
            await new Promise((resolve) => {
                this.serialPort.close(() => {
                    this.isConnected = false;
                    resolve();
                });
            });
            logger.info('Disconnected from Arduino');
        }
    }
}

// Create and start the client
const client = new ArduinoClient('COM3'); // Adjust port as needed

async function startClient() {
    try {
        const connected = await client.connect();
        if (connected) {
            logger.info('Arduino client started successfully');
            
            // Start periodic health check
            setInterval(async () => {
                const healthStatus = await client.getHealthStatus();
                logger.info(`Health status: ${JSON.stringify(healthStatus)}`);
                
                // Send health status to server
                client.sendToServer('devices/health', healthStatus);
            }, 300000); // Every 5 minutes
        } else {
            logger.error('Failed to start Arduino client');
            process.exit(1);
        }
    } catch (error) {
        logger.error(`Error starting Arduino client: ${error.message}`);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    logger.info('Shutting down Arduino client...');
    await client.disconnect();
    process.exit(0);
});

startClient(); 