declare module 'node-dahua-api' {
  export class DahuaAPI {
    constructor(config: {
      host: string;
      port: number;
      username: string;
      password: string;
    });
    
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getSnapshot(): Promise<Buffer>;
    startStream(callback: (frame: Buffer) => void): void;
    stopStream(): void;
  }
} 