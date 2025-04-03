import { CAMERA_CONFIG } from '../utils/constants';

interface CameraStreamOptions {
  width?: number;
  height?: number;
  quality?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

class CameraService {
  private streamUrl: string;
  private auth: string;

  constructor() {
    const { ip, username, password, port } = CAMERA_CONFIG.ENTRY_CAMERA;
    this.streamUrl = `rtsp://${username}:${password}@${ip}:${port}/cam/realmonitor?channel=1&subtype=0`;
    this.auth = 'Basic ' + btoa(`${username}:${password}`);
  }

  /**
   * Get the camera stream URL with authentication and quality parameters
   */
  getStreamUrl(options: CameraStreamOptions = {}) {
    const { ip, username, password } = CAMERA_CONFIG.ENTRY_CAMERA;
    const {
      width = 1280,
      height = 720,
      quality = 90,
      brightness = 50,
      contrast = 50,
      saturation = 50
    } = options;

    // For MJPEG stream using Dahua specific endpoint with quality parameters
    return `http://${username}:${password}@${ip}/cgi-bin/mjpg/video.cgi?channel=1&subtype=0` +
           `&width=${width}&height=${height}&quality=${quality}` +
           `&brightness=${brightness}&contrast=${contrast}&saturation=${saturation}`;
  }

  /**
   * Update camera settings
   */
  async updateCameraSettings(settings: Partial<CameraStreamOptions>): Promise<boolean> {
    try {
      const { ip } = CAMERA_CONFIG.ENTRY_CAMERA;
      const response = await fetch(`http://${ip}/cgi-bin/configManager.cgi?action=setConfig&channel=1`, {
        method: 'POST',
        headers: {
          'Authorization': this.auth,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: Object.entries(settings)
          .map(([key, value]) => `VideoInOptions[0].${key}=${value}`)
          .join('&')
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to update camera settings:', error);
      return false;
    }
  }

  /**
   * Take a snapshot from the camera with quality parameters
   */
  async takeSnapshot(options: CameraStreamOptions = {}): Promise<string> {
    try {
      const { ip, username, password } = CAMERA_CONFIG.ENTRY_CAMERA;
      const {
        width = 1920,
        height = 1080,
        quality = 100
      } = options;

      const response = await fetch(
        `http://${username}:${password}@${ip}/cgi-bin/snapshot.cgi?channel=1&subtype=0` +
        `&width=${width}&height=${height}&quality=${quality}`, 
        {
          headers: {
            'Accept': 'image/jpeg'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to take snapshot');
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error taking snapshot:', error);
      throw error;
    }
  }

  /**
   * Test camera connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { ip, username, password } = CAMERA_CONFIG.ENTRY_CAMERA;
      // Use a simpler endpoint for connection test
      const response = await fetch(`http://${username}:${password}@${ip}/cgi-bin/global.cgi?action=getCurrentTime`);
      
      if (!response.ok) {
        throw new Error('Camera connection test failed');
      }

      const data = await response.text();
      console.log('Camera connection test response:', data);

      return true;
    } catch (error) {
      console.error('Camera connection test failed:', error);
      return false;
    }
  }

  /**
   * Get RTSP stream URL
   */
  getRtspStreamUrl(): string {
    return this.streamUrl;
  }
}

export const cameraService = new CameraService(); 