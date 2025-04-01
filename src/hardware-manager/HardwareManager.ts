import { SerialPort } from 'serialport';
import NodeWebcam from 'node-webcam';
import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import { hardwareConfig } from './config/hardware';
import { promises as fs } from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { HardwareDeviceType, HardwareStatus, GateStatus } from '../shared/types';
import { IHardwareManager, TicketData } from './interfaces/IHardwareManager';
import { ILogger, LogCategory } from './interfaces/ILogger';
import { FileLogger } from './logger/FileLogger';
import { EventEmitter } from 'events';

export interface GateController {
  port: SerialPort;
  isOpen: boolean;
}

export interface Camera {
  device: NodeWebcam.Webcam;
  id: number;
}

export interface Printer {
  device: ThermalPrinter;
  type: string;
  port: string;
}

export class HardwareManager extends EventEmitter implements IHardwareManager {
  private entryGate!: GateController;
  private exitGate!: GateController;
  private entryCamera!: Camera;
  private exitCamera!: Camera;
  private entryPrinter!: Printer;
  private exitPrinter!: Printer;
  private isInitialized = false;
  private logger: ILogger;

  constructor(logger?: ILogger) {
    super();
    this.logger = logger || new FileLogger();
    this.initializeHardware();
  }

  private async initializeHardware() {
    try {
      await this.logger.info(
        LogCategory.INITIALIZATION,
        HardwareDeviceType.GATE,
        'SYSTEM',
        'Starting hardware initialization'
      );

      // Initialize gates
      this.entryGate = await this.initializeGate(hardwareConfig.entry.gatePort);
      this.exitGate = await this.initializeGate(hardwareConfig.exit.gatePort);

      await this.logger.info(
        LogCategory.INITIALIZATION,
        HardwareDeviceType.GATE,
        'GATES',
        'Gates initialized successfully',
        { entry: hardwareConfig.entry.gatePort, exit: hardwareConfig.exit.gatePort }
      );

      // Initialize cameras
      this.entryCamera = this.initializeCamera(hardwareConfig.entry.cameraId);
      this.exitCamera = this.initializeCamera(hardwareConfig.exit.cameraId);

      await this.logger.info(
        LogCategory.INITIALIZATION,
        HardwareDeviceType.CAMERA,
        'CAMERAS',
        'Cameras initialized successfully',
        { entry: hardwareConfig.entry.cameraId, exit: hardwareConfig.exit.cameraId }
      );

      // Initialize printers
      this.entryPrinter = await this.initializePrinter(
        hardwareConfig.entry.printerType as PrinterTypes,
        hardwareConfig.entry.printerPort
      );
      this.exitPrinter = await this.initializePrinter(
        hardwareConfig.exit.printerType as PrinterTypes,
        hardwareConfig.exit.printerPort
      );

      await this.logger.info(
        LogCategory.INITIALIZATION,
        HardwareDeviceType.PRINTER,
        'PRINTERS',
        'Printers initialized successfully',
        {
          entry: { type: hardwareConfig.entry.printerType, port: hardwareConfig.entry.printerPort },
          exit: { type: hardwareConfig.exit.printerType, port: hardwareConfig.exit.printerPort }
        }
      );

      // Ensure image storage directory exists
      await fs.mkdir(hardwareConfig.imageStoragePath, { recursive: true });

      this.isInitialized = true;
      this.emit('initialized');

      await this.logger.info(
        LogCategory.INITIALIZATION,
        HardwareDeviceType.GATE,
        'SYSTEM',
        'Hardware initialization completed successfully'
      );
    } catch (error) {
      await this.logger.error(
        LogCategory.INITIALIZATION,
        HardwareDeviceType.GATE,
        'SYSTEM',
        'Hardware initialization failed',
        error as Error
      );
      throw error;
    }
  }

  private async initializeGate(portName: string): Promise<GateController> {
    const port = new SerialPort({ path: portName, baudRate: 9600 });
    return { port, isOpen: false };
  }

  private initializeCamera(deviceId: number): Camera {
    const opts = {
      width: 1280,
      height: 720,
      quality: 100,
      delay: 0,
      saveShots: true,
      output: 'jpeg' as const,
      device: deviceId.toString(),
      callbackReturn: 'buffer' as const,
      verbose: false
    };

    const camera = NodeWebcam.create(opts);
    return { device: camera, id: deviceId };
  }

  private async initializePrinter(type: PrinterTypes, port: string): Promise<Printer> {
    const printer = new ThermalPrinter({
      type,
      interface: port,
      width: hardwareConfig.ticketTemplate.width,
      characterSet: 'PC437' as CharacterSet,
      removeSpecialCharacters: false,
      lineCharacter: '-',
    });

    await printer.execute();
    return { device: printer, type, port };
  }

  public async openGate(isEntry: boolean): Promise<void> {
    const gate = isEntry ? this.entryGate : this.exitGate;
    const gateId = isEntry ? hardwareConfig.entry.gatePort : hardwareConfig.exit.gatePort;

    if (!gate.isOpen) {
      try {
        await this.logger.info(
          LogCategory.GATE_OPERATION,
          HardwareDeviceType.GATE,
          gateId,
          `Opening ${isEntry ? 'entry' : 'exit'} gate`
        );

        await new Promise<void>((resolve, reject) => {
          gate.port.write('OPEN\n', (error) => {
            if (error) reject(error);
            else {
              gate.isOpen = true;
              resolve();
            }
          });
        });

        await this.logger.info(
          LogCategory.GATE_OPERATION,
          HardwareDeviceType.GATE,
          gateId,
          `${isEntry ? 'Entry' : 'Exit'} gate opened successfully`
        );

        // Auto-close after 5 seconds
        setTimeout(async () => {
          await this.closeGate(isEntry);
        }, 5000);
      } catch (error) {
        await this.logger.error(
          LogCategory.GATE_OPERATION,
          HardwareDeviceType.GATE,
          gateId,
          `Failed to open ${isEntry ? 'entry' : 'exit'} gate`,
          error as Error
        );
        throw error;
      }
    }
  }

  public async closeGate(isEntry: boolean): Promise<void> {
    const gate = isEntry ? this.entryGate : this.exitGate;
    const gateId = isEntry ? hardwareConfig.entry.gatePort : hardwareConfig.exit.gatePort;

    if (gate.isOpen) {
      try {
        await this.logger.info(
          LogCategory.GATE_OPERATION,
          HardwareDeviceType.GATE,
          gateId,
          `Closing ${isEntry ? 'entry' : 'exit'} gate`
        );

        await new Promise<void>((resolve, reject) => {
          gate.port.write('CLOSE\n', (error) => {
            if (error) reject(error);
            else {
              gate.isOpen = false;
              resolve();
            }
          });
        });

        await this.logger.info(
          LogCategory.GATE_OPERATION,
          HardwareDeviceType.GATE,
          gateId,
          `${isEntry ? 'Entry' : 'Exit'} gate closed successfully`
        );
      } catch (error) {
        await this.logger.error(
          LogCategory.GATE_OPERATION,
          HardwareDeviceType.GATE,
          gateId,
          `Failed to close ${isEntry ? 'entry' : 'exit'} gate`,
          error as Error
        );
        throw error;
      }
    }
  }

  public async captureImage(isEntry: boolean): Promise<string> {
    const camera = isEntry ? this.entryCamera : this.exitCamera;
    const cameraId = isEntry ? hardwareConfig.entry.cameraId : hardwareConfig.exit.cameraId;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${isEntry ? 'entry' : 'exit'}_${timestamp}.jpg`;
    const filepath = path.join(hardwareConfig.imageStoragePath, filename);

    try {
      await this.logger.info(
        LogCategory.CAMERA_OPERATION,
        HardwareDeviceType.CAMERA,
        cameraId.toString(),
        `Capturing image at ${isEntry ? 'entry' : 'exit'} point`
      );

      const imagePath = await new Promise<string>((resolve, reject) => {
        camera.device.capture(filepath, (err: Error | null, data: any) => {
          if (err) reject(err);
          else resolve(filepath);
        });
      });

      await this.logger.info(
        LogCategory.CAMERA_OPERATION,
        HardwareDeviceType.CAMERA,
        cameraId.toString(),
        `Image captured successfully at ${isEntry ? 'entry' : 'exit'} point`,
        { filepath: imagePath }
      );

      return imagePath;
    } catch (error) {
      await this.logger.error(
        LogCategory.CAMERA_OPERATION,
        HardwareDeviceType.CAMERA,
        cameraId.toString(),
        `Failed to capture image at ${isEntry ? 'entry' : 'exit'} point`,
        error as Error
      );
      throw error;
    }
  }

  public async printTicket(isEntry: boolean, ticketData: TicketData): Promise<void> {
    const printer = isEntry ? this.entryPrinter : this.exitPrinter;
    const printerId = isEntry ? hardwareConfig.entry.printerPort : hardwareConfig.exit.printerPort;
    const { device } = printer;

    try {
      await this.logger.info(
        LogCategory.PRINTER_OPERATION,
        HardwareDeviceType.PRINTER,
        printerId,
        'Generating ticket',
        { ticketId: ticketData.ticketId }
      );

      // Generate QR code
      const qrCode = await QRCode.toString(ticketData.ticketId, {
        type: 'utf8',
        version: 2,
        errorCorrectionLevel: 'M' as const
      });

      // Print ticket
      device.setTextSize(1, 1);
      device.setTextNormal();
      device.println('PARKING TICKET');
      device.drawLine();

      device.setTextNormal();
      device.println(`Ticket ID: ${ticketData.ticketId}`);
      device.println(`Time: ${ticketData.timestamp}`);
      device.println(`Vehicle Type: ${ticketData.vehicleType}`);
      if (ticketData.plateNumber) {
        device.println(`Plate: ${ticketData.plateNumber}`);
      }
      device.drawLine();

      device.println(qrCode);
      device.drawLine();

      device.setTextSize(0, 0);
      device.println('Thank you for using our parking service!');
      device.cut();

      await device.execute();

      await this.logger.info(
        LogCategory.PRINTER_OPERATION,
        HardwareDeviceType.PRINTER,
        printerId,
        'Ticket printed successfully',
        { ticketId: ticketData.ticketId }
      );
    } catch (error) {
      await this.logger.error(
        LogCategory.PRINTER_OPERATION,
        HardwareDeviceType.PRINTER,
        printerId,
        'Failed to print ticket',
        error as Error,
        { ticketId: ticketData.ticketId }
      );
      throw error;
    }
  }

  public async cleanup(): Promise<void> {
    try {
      await this.logger.info(
        LogCategory.CLEANUP,
        HardwareDeviceType.GATE,
        'SYSTEM',
        'Starting hardware cleanup'
      );

      // Close all serial ports
      if (this.entryGate?.port) await this.entryGate.port.close();
      if (this.exitGate?.port) await this.exitGate.port.close();

      // Clean up printers
      if (this.entryPrinter?.device) await this.entryPrinter.device.clear();
      if (this.exitPrinter?.device) await this.exitPrinter.device.clear();

      await this.logger.info(
        LogCategory.CLEANUP,
        HardwareDeviceType.GATE,
        'SYSTEM',
        'Hardware cleanup completed successfully'
      );
    } catch (error) {
      await this.logger.error(
        LogCategory.CLEANUP,
        HardwareDeviceType.GATE,
        'SYSTEM',
        'Hardware cleanup failed',
        error as Error
      );
      throw error;
    }
  }

  public async getGateStatus(): Promise<GateStatus> {
    if (!this.isInitialized || !this.entryGate.port || !this.exitGate.port) {
      throw new Error('Hardware not initialized');
    }

    return {
      entry: {
        isOpen: this.entryGate.isOpen,
        lastOperation: new Date(),
        operatedBy: 'SYSTEM',
        deviceId: hardwareConfig.entry.gatePort,
      },
      exit: {
        isOpen: this.exitGate.isOpen,
        lastOperation: new Date(),
        operatedBy: 'SYSTEM',
        deviceId: hardwareConfig.exit.gatePort,
      },
    };
  }

  public async getPrinterStatus(): Promise<HardwareStatus> {
    if (!this.isInitialized || !this.entryPrinter.device || !this.exitPrinter.device) {
      throw new Error('Hardware not initialized');
    }

    return {
      deviceType: HardwareDeviceType.PRINTER,
      deviceId: this.entryPrinter.port,
      status: 'ONLINE',
      lastChecked: new Date(),
    };
  }

  public async getStatus(): Promise<HardwareStatus> {
    if (!this.isInitialized) {
      return {
        deviceType: HardwareDeviceType.GATE,
        deviceId: 'SYSTEM',
        status: 'OFFLINE',
        lastChecked: new Date(),
      };
    }

    return {
      deviceType: HardwareDeviceType.GATE,
      deviceId: 'SYSTEM',
      status: 'ONLINE',
      lastChecked: new Date(),
    };
  }
} 