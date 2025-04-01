import { GateController as IGateController } from '../types';

export interface GateController extends IGateController {}

export class ArduinoGateController implements GateController {
  private isGateOpen: boolean = false;
  private config: any;

  initialize(config: any): void {
    this.config = config;
  }

  async open(): Promise<void> {
    // Implementasi membuka gerbang
  }

  async close(): Promise<void> {
    // Implementasi menutup gerbang
  }
} 