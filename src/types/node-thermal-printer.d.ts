declare module 'node-thermal-printer' {
  export enum PrinterTypes {
    EPSON = 'epson',
    STAR = 'star',
    CUSTOM = 'custom'
  }

  interface PrinterOptions {
    type: PrinterTypes;
    interface: string;
    width?: number;
    characterSet?: string;
    removeSpecialCharacters?: boolean;
    options?: {
      timeout?: number;
    };
  }

  export class ThermalPrinter {
    constructor(options: PrinterOptions);
    alignCenter(): void;
    alignLeft(): void;
    setTextNormal(): void;
    println(text: string): void;
    cut(): void;
    execute(): Promise<void>;
    isPrinterConnected(): Promise<boolean>;
  }
} 