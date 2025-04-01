import WebSocket from 'ws';
import { ServerConfig } from '../types';

export interface WebSocketClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(event: string, data: any): Promise<void>;
  on(event: string, callback: (data: any) => void): void;
  initialize(config: ServerConfig): void;
}

export class LocalWebSocketClient implements WebSocketClient {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 5000;
  private config: ServerConfig;

  initialize(config: ServerConfig): void {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`ws://${this.config.network.serverIp}:${this.config.network.serverPort}`);

        this.ws.on('open', () => {
          console.log('Connected to WebSocket server');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', (data: string) => {
          try {
            const message = JSON.parse(data);
            const handlers = this.eventHandlers.get(message.event) || [];
            handlers.forEach(handler => handler(message.data));
          } catch (error) {
            console.error('Error processing message:', error);
          }
        });

        this.ws.on('close', () => {
          console.log('WebSocket connection closed');
          this.handleReconnect();
        });

        this.ws.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      resolve();
    });
  }

  async send(event: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      try {
        const message = JSON.stringify({ event, data });
        this.ws.send(message, (error: Error | undefined) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  on(event: string, callback: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(callback);
    this.eventHandlers.set(event, handlers);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectTimeout);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
} 