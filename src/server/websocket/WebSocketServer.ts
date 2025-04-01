import { WebSocket, WebSocketServer as WSServer } from 'ws';
import { WebSocketMessage } from '../../shared/types';

export class WebSocketServer {
  private wss: WSServer;
  private clients: Map<WebSocket, string> = new Map();

  constructor(port: number) {
    this.wss = new WSServer({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (message: string) => {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(message);
          this.handleMessage(ws, parsedMessage);
        } catch (error) {
          console.error('Failed to parse message:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            payload: 'Invalid message format',
            timestamp: new Date().toISOString(),
            source: 'SERVER'
          }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    // Register client with its source identifier
    if (message.type === 'REGISTER') {
      this.clients.set(ws, message.source);
      return;
    }

    // Broadcast message to all relevant clients
    this.broadcast(message);
  }

  public broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  public broadcastToSource(message: WebSocketMessage, targetSource: string): void {
    const messageStr = JSON.stringify(message);
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && this.clients.get(client) === targetSource) {
        client.send(messageStr);
      }
    });
  }

  public dispose(): void {
    this.wss.close();
  }
} 