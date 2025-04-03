declare module 'node-webcam' {
  interface WebcamOptions {
    width: number;
    height: number;
    quality: number;
    frames: number;
    output: string;
    device: string;
    callbackReturn: 'location' | 'buffer';
  }

  interface WebcamInstance {
    capture(path: string, callback: (err: Error | null, data: Buffer) => void): void;
    getSourceList(callback: (err: Error | null, sources: string[]) => void): void;
    start(): void;
    stop(): void;
  }

  function createWebcam(options: WebcamOptions): WebcamInstance;
  export = createWebcam;
} 