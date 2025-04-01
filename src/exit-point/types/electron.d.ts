declare module 'electron' {
  import { EventEmitter } from 'events';

  export interface BrowserWindowOptions {
    width?: number;
    height?: number;
    webPreferences?: {
      nodeIntegration?: boolean;
      contextIsolation?: boolean;
    };
  }

  export interface IpcMainInvokeEvent {
    sender: any;
    frameId: number;
    returnValue: any;
  }

  export class BrowserWindow {
    constructor(options?: BrowserWindowOptions);
    loadFile(filePath: string): void;
    webContents: {
      send(channel: string, ...args: any[]): void;
    };
    static getAllWindows(): BrowserWindow[];
  }

  export class app extends EventEmitter {
    static whenReady(): Promise<void>;
    static on(event: string, listener: (...args: any[]) => void): this;
    static quit(): void;
  }

  export class ipcMain {
    static handle(channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>): void;
  }
} 