import { promises as fs } from 'fs';
import path from 'path';
import { ILogger, LogEntry, LogLevel, LogCategory } from '../interfaces/ILogger';
import { HardwareDeviceType } from '../../shared/types';

export class FileLogger implements ILogger {
  private readonly logDir: string;
  private readonly logFile: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly maxFiles: number = 5;

  constructor(logDir: string = 'logs') {
    this.logDir = logDir;
    this.logFile = path.join(this.logDir, 'hardware.log');
    this.initializeLogger();
  }

  private async initializeLogger(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
      throw error;
    }
  }

  private async rotateLogFile(): Promise<void> {
    try {
      const stats = await fs.stat(this.logFile);
      if (stats.size >= this.maxFileSize) {
        // Rotate existing log files
        for (let i = this.maxFiles - 1; i > 0; i--) {
          const oldFile = `${this.logFile}.${i}`;
          const newFile = `${this.logFile}.${i + 1}`;
          try {
            await fs.access(oldFile);
            await fs.rename(oldFile, newFile);
          } catch (error) {
            // File doesn't exist, skip
          }
        }
        // Rename current log file
        await fs.rename(this.logFile, `${this.logFile}.1`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  public async log(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date()
    };

    await this.rotateLogFile();

    const logLine = JSON.stringify({
      ...fullEntry,
      error: fullEntry.error ? {
        message: fullEntry.error.message,
        stack: fullEntry.error.stack
      } : undefined
    }) + '\n';

    await fs.appendFile(this.logFile, logLine, 'utf8');
  }

  public async info(
    category: LogCategory,
    deviceType: HardwareDeviceType,
    deviceId: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      category,
      deviceType,
      deviceId,
      message,
      details
    });
  }

  public async warn(
    category: LogCategory,
    deviceType: HardwareDeviceType,
    deviceId: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.WARNING,
      category,
      deviceType,
      deviceId,
      message,
      details
    });
  }

  public async error(
    category: LogCategory,
    deviceType: HardwareDeviceType,
    deviceId: string,
    message: string,
    error: Error,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.ERROR,
      category,
      deviceType,
      deviceId,
      message,
      error,
      details
    });
  }

  public async debug(
    category: LogCategory,
    deviceType: HardwareDeviceType,
    deviceId: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.DEBUG,
      category,
      deviceType,
      deviceId,
      message,
      details
    });
  }

  public async query(options: {
    startDate?: Date;
    endDate?: Date;
    level?: LogLevel;
    category?: LogCategory;
    deviceType?: HardwareDeviceType;
    deviceId?: string;
  }): Promise<LogEntry[]> {
    const logs: LogEntry[] = [];
    const fileContent = await fs.readFile(this.logFile, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const entry: LogEntry = JSON.parse(line);

      // Apply filters
      if (options.startDate && entry.timestamp < options.startDate) continue;
      if (options.endDate && entry.timestamp > options.endDate) continue;
      if (options.level && entry.level !== options.level) continue;
      if (options.category && entry.category !== options.category) continue;
      if (options.deviceType && entry.deviceType !== options.deviceType) continue;
      if (options.deviceId && entry.deviceId !== options.deviceId) continue;

      // Convert timestamp string back to Date object
      entry.timestamp = new Date(entry.timestamp);
      logs.push(entry);
    }

    return logs;
  }
} 