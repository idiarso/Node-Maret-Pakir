import { DahuaAPI } from 'node-dahua-api';

export class CameraService {
  private entryCamera: DahuaAPI;
  private exitCamera: DahuaAPI;
  private isConnected: boolean = false;

  constructor() {
    this.entryCamera = new DahuaAPI({
      host: '192.168.2.5',
      port: 37777,
      username: 'admin',
      password: '@dminparkir',
      channel: 1,
    });

    this.exitCamera = new DahuaAPI({
      host: '192.168.2.7',
      port: 37777,
      username: 'admin',
      password: '@dminparkir',
      channel: 1,
    });
  }

  async connect() {
    try {
      await this.entryCamera.connect();
      await this.exitCamera.connect();
      this.isConnected = true;
      console.log('Cameras connected successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect cameras:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.entryCamera.disconnect();
      await this.exitCamera.disconnect();
      this.isConnected = false;
      console.log('Cameras disconnected successfully');
      return true;
    } catch (error) {
      console.error('Failed to disconnect cameras:', error);
      throw error;
    }
  }

  async captureEntryImage() {
    if (!this.isConnected) {
      throw new Error('Cameras not connected');
    }
    try {
      const image = await this.entryCamera.snapshot();
      return image;
    } catch (error) {
      console.error('Failed to capture entry image:', error);
      throw error;
    }
  }

  async captureExitImage() {
    if (!this.isConnected) {
      throw new Error('Cameras not connected');
    }
    try {
      const image = await this.exitCamera.snapshot();
      return image;
    } catch (error) {
      console.error('Failed to capture exit image:', error);
      throw error;
    }
  }

  isConnectedToCameras() {
    return this.isConnected;
  }
} 