import { LogEntry, LogLevel, LogCategory } from '../interfaces/ILogger';
import { HardwareDeviceType } from '../../shared/types';

export interface LogSummary {
  totalEntries: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
  byDeviceType: Record<HardwareDeviceType, number>;
  errorRate: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface DeviceMetrics {
  deviceId: string;
  deviceType: HardwareDeviceType;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  errorRate: number;
  averageOperationTime?: number;
  lastOperation: Date;
}

export class LogAnalyzer {
  constructor(private logs: LogEntry[]) {}

  public getSummary(): LogSummary {
    const summary: LogSummary = {
      totalEntries: this.logs.length,
      byLevel: {
        [LogLevel.INFO]: 0,
        [LogLevel.WARNING]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.DEBUG]: 0,
      },
      byCategory: {
        [LogCategory.GATE_OPERATION]: 0,
        [LogCategory.CAMERA_OPERATION]: 0,
        [LogCategory.PRINTER_OPERATION]: 0,
        [LogCategory.HARDWARE_STATUS]: 0,
        [LogCategory.INITIALIZATION]: 0,
        [LogCategory.CLEANUP]: 0,
      },
      byDeviceType: {
        [HardwareDeviceType.GATE]: 0,
        [HardwareDeviceType.CAMERA]: 0,
        [HardwareDeviceType.PRINTER]: 0,
        [HardwareDeviceType.SCANNER]: 0,
      },
      errorRate: 0,
      timeRange: {
        start: new Date(Math.min(...this.logs.map(log => log.timestamp.getTime()))),
        end: new Date(Math.max(...this.logs.map(log => log.timestamp.getTime()))),
      },
    };

    let errorCount = 0;

    for (const log of this.logs) {
      summary.byLevel[log.level]++;
      summary.byCategory[log.category]++;
      summary.byDeviceType[log.deviceType]++;

      if (log.level === LogLevel.ERROR) {
        errorCount++;
      }
    }

    summary.errorRate = errorCount / summary.totalEntries;

    return summary;
  }

  public getDeviceMetrics(): Map<string, DeviceMetrics> {
    const deviceMap = new Map<string, DeviceMetrics>();

    for (const log of this.logs) {
      const deviceKey = `${log.deviceType}-${log.deviceId}`;
      let metrics = deviceMap.get(deviceKey);

      if (!metrics) {
        metrics = {
          deviceId: log.deviceId,
          deviceType: log.deviceType,
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          errorRate: 0,
          lastOperation: log.timestamp,
        };
        deviceMap.set(deviceKey, metrics);
      }

      metrics.totalOperations++;
      if (log.level === LogLevel.ERROR) {
        metrics.failedOperations++;
      } else {
        metrics.successfulOperations++;
      }
      metrics.errorRate = metrics.failedOperations / metrics.totalOperations;
      metrics.lastOperation = log.timestamp;
    }

    return deviceMap;
  }

  public getErrorTrends(timeWindow: number = 3600000): { timestamp: Date; count: number }[] {
    const trends: { timestamp: Date; count: number }[] = [];
    const windowStart = new Date(Math.min(...this.logs.map(log => log.timestamp.getTime())));
    const windowEnd = new Date(Math.max(...this.logs.map(log => log.timestamp.getTime())));

    for (let time = windowStart.getTime(); time <= windowEnd.getTime(); time += timeWindow) {
      const windowErrors = this.logs.filter(
        log =>
          log.level === LogLevel.ERROR &&
          log.timestamp.getTime() >= time &&
          log.timestamp.getTime() < time + timeWindow
      );

      trends.push({
        timestamp: new Date(time),
        count: windowErrors.length,
      });
    }

    return trends;
  }

  public getDeviceAvailability(deviceType: HardwareDeviceType): Record<string, number> {
    const deviceLogs = this.logs.filter(log => log.deviceType === deviceType);
    const availability: Record<string, number> = {};

    for (const log of deviceLogs) {
      if (!availability[log.deviceId]) {
        availability[log.deviceId] = 0;
      }

      // Consider device available if no errors are reported
      if (log.level !== LogLevel.ERROR) {
        availability[log.deviceId]++;
      }
    }

    // Convert counts to percentages
    for (const deviceId in availability) {
      const totalLogs = deviceLogs.filter(log => log.deviceId === deviceId).length;
      availability[deviceId] = (availability[deviceId] / totalLogs) * 100;
    }

    return availability;
  }

  public findCorrelatedErrors(timeThreshold: number = 5000): LogEntry[][] {
    const correlatedErrors: LogEntry[][] = [];
    const processedLogs = new Set<LogEntry>();

    for (const log of this.logs) {
      if (log.level === LogLevel.ERROR && !processedLogs.has(log)) {
        const relatedErrors = this.logs.filter(
          otherLog =>
            otherLog.level === LogLevel.ERROR &&
            Math.abs(otherLog.timestamp.getTime() - log.timestamp.getTime()) <= timeThreshold
        );

        if (relatedErrors.length > 1) {
          correlatedErrors.push(relatedErrors);
          relatedErrors.forEach(error => processedLogs.add(error));
        }
      }
    }

    return correlatedErrors;
  }
} 