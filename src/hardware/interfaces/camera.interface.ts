import { EventEmitter } from 'events';
import NodeWebcam from 'node-webcam';
import { promisify } from 'util';

export interface CameraConfig {
  deviceId: number;
  width?: number;
  height?: number;
  quality?: number;
  output?: 'jpeg' | 'png';
  frames?: number;
  delay?: number;
}

export interface CaptureOptions {
  timestamp?: boolean;
  rotation?: number;
}

export interface WebcamOptions {
  width: number;
  height: number;
  quality: number;
  output: string;
  device: string;
  callbackReturn: string;
  verbose: boolean;
}

export class CameraController extends EventEmitter {
  private camera: NodeWebcam.Webcam | null = null;
  private readonly defaultConfig: CameraConfig = {
    deviceId: 0,
    width: 1280,
    height: 720,
    quality: 100,
    output: 'jpeg',
    frames: 1,
    delay: 0,
  };

  constructor(private readonly config: Partial<CameraConfig>) {
    super();
    this.initialize();
  }

  private initialize(): void {
    try {
      const opts = {
        width: this.config.width ?? this.defaultConfig.width,
        height: this.config.height ?? this.defaultConfig.height,
        quality: this.config.quality ?? this.defaultConfig.quality,
        output: this.config.output ?? this.defaultConfig.output,
        device: `video${this.config.deviceId ?? this.defaultConfig.deviceId}`,
        callbackReturn: 'base64' as const,
        verbose: false,
      };

      this.camera = NodeWebcam.create(opts);
      this.emit('ready');
    } catch (error) {
      this.emit('error', error);
    }
  }

  public async capture(options: CaptureOptions = {}): Promise<string> {
    if (!this.camera) {
      throw new Error('Camera not initialized');
    }

    const capture = promisify(this.camera.capture).bind(this.camera);
    const timestamp = Date.now();
    const filename = `capture_${timestamp}`;

    try {
      const data = await capture(filename);
      this.emit('capture', { timestamp, data });
      return data as string;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async startStream(callback: (image: string) => void, interval = 100): Promise<void> {
    if (!this.camera) {
      throw new Error('Camera not initialized');
    }

    const streamLoop = async () => {
      try {
        const image = await this.capture();
        callback(image);
        this.emit('frame', image);
        setTimeout(streamLoop, interval);
      } catch (error) {
        this.emit('error', error);
      }
    };

    streamLoop();
  }

  public dispose(): void {
    // Node-webcam doesn't provide a direct way to close the device
    // The garbage collector will handle it
    this.camera = null;
  }
} 