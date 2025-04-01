declare module 'camera' {
    export interface CameraConfig {
        deviceId: string;
        resolution: {
            width: number;
            height: number;
        };
        frameRate: number;
    }

    export class Camera {
        constructor(config: CameraConfig);
        initialize(): Promise<void>;
        capture(): Promise<Buffer>;
        start(): Promise<void>;
        stop(): Promise<void>;
    }
} 