import { HardwareManager, HardwareConfig } from '../hardware/hardware.manager';
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface EntryPointConfig extends HardwareConfig {
  serverUrl: string;
  operatorId: string;
}

export interface VehicleType {
  id: string;
  name: string;
  price: number;
}

interface PlateRecognitionResponse {
  plateNumber: string;
}

interface TicketGenerationResponse {
  barcode: string;
}

export interface TicketData {
    id: string;
    barcode: string;
    plateNumber: string;
    vehicleType: string;
    entryTime: Date;
    operatorId: string;
    exitTime?: Date;
    paymentAmount?: number;
}

export class EntryPoint extends EventEmitter {
  private ws: WebSocket | null = null;
  private selectedVehicleType: VehicleType | null = null;
  private plateNumber: string | null = null;
  private isProcessing = false;

  constructor(
    private readonly config: EntryPointConfig,
    private readonly hardwareManager: HardwareManager
  ) {
    super();
    this.initialize();
  }

  private initialize(): void {
    this.initializeWebSocket();
    this.initializeHardware();
    this.startTimeUpdate();
  }

  private initializeWebSocket(): void {
    this.ws = new WebSocket(this.config.serverUrl);

    this.ws.onopen = () => {
      this.emit('connected');
      this.updateStatus('connected');
    };

    this.ws.onclose = () => {
      this.emit('disconnected');
      this.updateStatus('disconnected');
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
      this.updateStatus('error');
    };

    this.ws.onmessage = (event) => {
      this.handleWebSocketMessage(JSON.parse(event.data));
    };
  }

  private initializeHardware(): void {
    // Start camera stream
    this.hardwareManager.startCameraStream().then(() => {
      this.hardwareManager.on('cameraFrame', (image: Buffer) => {
        this.emit('cameraFrame', image);
      });
    });

    // Start scanner
    this.hardwareManager.startScanner().then(() => {
      this.hardwareManager.on('scannerData', (data: string) => {
        this.handleBarcodeScan({ barcode: data, timestamp: Date.now() });
      });
    });

    // Listen for hardware events
    this.hardwareManager.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  private startTimeUpdate(): void {
    setInterval(() => {
      this.emit('timeUpdate', new Date());
    }, 1000);
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'GATE_STATUS':
        this.emit('gateStatusUpdate', message.data);
        break;
      case 'PRINT_STATUS':
        this.emit('printStatusUpdate', message.data);
        break;
      case 'ERROR':
        this.emit('error', message.data);
        break;
      default:
        this.emit('message', message);
    }
  }

  private handleBarcodeScan(result: { barcode: string; timestamp: number }): void {
    this.emit('barcodeScanned', result);
  }

  private updateStatus(status: 'connected' | 'disconnected' | 'error'): void {
    this.emit('statusUpdate', status);
  }

  // Public methods for UI interaction
  public async selectVehicleType(type: VehicleType): Promise<void> {
    this.selectedVehicleType = type;
    this.emit('vehicleTypeSelected', type);
  }

  public async capturePlate(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const image = await this.hardwareManager.captureImage();
      this.emit('plateCaptured', image);

      // Send image to server for plate recognition
      const response = await fetch(`${this.config.serverUrl}/api/recognize-plate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        throw new Error('Failed to recognize plate');
      }

      const data = await response.json();
      if (!data || typeof data !== 'object' || !('plateNumber' in data)) {
        throw new Error('Invalid response format from plate recognition API');
      }

      const { plateNumber } = data as PlateRecognitionResponse;
      if (!plateNumber) throw new Error('No plate number returned from recognition');
      this.plateNumber = plateNumber;
      this.emit('plateRecognized', plateNumber);
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Unknown error during plate capture'));
    } finally {
      this.isProcessing = false;
    }
  }

  public async generateTicket(): Promise<void> {
    if (!this.plateNumber || !this.selectedVehicleType || this.isProcessing) {
      throw new Error('Missing required data for ticket generation');
    }

    this.isProcessing = true;

    try {
      const ticketData = {
        id: crypto.randomUUID(),
        plateNumber: this.plateNumber,
        vehicleType: this.selectedVehicleType.id,
        entryTime: new Date(),
        operatorId: this.config.operatorId,
      };

      // Send ticket data to server
      const response = await fetch(`${this.config.serverUrl}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ticket');
      }

      const data = await response.json();
      if (!data || typeof data !== 'object' || !('barcode' in data)) {
        throw new Error('Invalid response format from ticket generation API');
      }

      const { barcode } = data as TicketGenerationResponse;
      if (!barcode) throw new Error('No barcode returned from ticket generation');

      // Print ticket
      await this.hardwareManager.printTicket({
        ...ticketData,
        barcode,
      });

      // Open gate
      await this.hardwareManager.openGate();

      this.emit('ticketGenerated', { ...ticketData, barcode });
      this.plateNumber = null;
      this.selectedVehicleType = null;
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Unknown error during ticket generation'));
    } finally {
      this.isProcessing = false;
    }
  }

  public async openGate(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      await this.hardwareManager.openGate();
      this.emit('gateOpened');
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Unknown error during gate operation'));
    } finally {
      this.isProcessing = false;
    }
  }

  public dispose(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.hardwareManager.dispose();
  }
} 