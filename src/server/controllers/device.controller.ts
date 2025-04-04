import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Device, DeviceType, DeviceStatus } from "../entities/Device";
import { DeviceHealthCheck } from "../entities/DeviceHealthCheck";
import { DeviceLog, LogType } from "../entities/DeviceLog";
import { DeepPartial } from "typeorm";
import { Logger } from "../../shared/services/Logger";

const logger = Logger.getInstance();

export class DeviceController {
    private static instance: DeviceController;
    private deviceRepository = AppDataSource.getRepository(Device);
    private healthCheckRepository = AppDataSource.getRepository(DeviceHealthCheck);
    private deviceLogRepository = AppDataSource.getRepository(DeviceLog);

    private constructor() {}

    public static getInstance(): DeviceController {
        if (!DeviceController.instance) {
            DeviceController.instance = new DeviceController();
        }
        return DeviceController.instance;
    }

    // Get all devices
    public async getAllDevices(req: Request, res: Response) {
        try {
            const devices = await this.deviceRepository.find({
                relations: ["healthChecks", "logs"]
            });
            res.json(devices);
        } catch (error) {
            logger.error("Error fetching devices:", error);
            res.status(500).json({ message: "Error fetching devices", error });
        }
    }

    // Get device by ID
    public async getDeviceById(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const device = await this.deviceRepository.findOne({
                where: { id },
                relations: ["healthChecks", "logs"]
            });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }
            
            res.json(device);
        } catch (error) {
            logger.error("Error fetching device:", error);
            res.status(500).json({ message: "Error fetching device", error });
        }
    }

    // Create new device
    public async createDevice(req: Request, res: Response) {
        try {
            const { name, type, location, macAddress, parkingAreaId } = req.body;
            
            if (!name || !type || !macAddress || !parkingAreaId) {
                return res.status(400).json({ message: "Name, type, MAC address, and parking area ID are required" });
            }

            if (!Object.values(DeviceType).includes(type)) {
                return res.status(400).json({ message: "Invalid device type" });
            }

            const deviceData: DeepPartial<Device> = {
                name,
                type,
                location,
                macAddress,
                parkingAreaId,
                isActive: true
            };

            const device = this.deviceRepository.create(deviceData);
            await this.deviceRepository.save(device);
            res.status(201).json(device);
        } catch (error) {
            logger.error("Error creating device:", error);
            res.status(500).json({ message: "Error creating device", error });
        }
    }

    // Update device
    public async updateDevice(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const { name, type, location, isActive, macAddress, parkingAreaId } = req.body;

            const device = await this.deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            if (name) device.name = name;
            if (type && Object.values(DeviceType).includes(type)) device.type = type;
            if (location) device.location = location;
            if (typeof isActive === 'boolean') device.isActive = isActive;
            if (macAddress) device.macAddress = macAddress;
            if (parkingAreaId) device.parkingAreaId = parkingAreaId;

            await this.deviceRepository.save(device);
            res.json(device);
        } catch (error) {
            logger.error("Error updating device:", error);
            res.status(500).json({ message: "Error updating device", error });
        }
    }

    // Delete device
    public async deleteDevice(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const device = await this.deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            await this.deviceRepository.remove(device);
            res.json({ message: "Device deleted successfully" });
        } catch (error) {
            logger.error("Error deleting device:", error);
            res.status(500).json({ message: "Error deleting device", error });
        }
    }

    // Perform health check
    public async performHealthCheck(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const device = await this.deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            // Simulate health check (in real implementation, this would check actual device status)
            const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
            device.isActive = isHealthy;
            device.lastSeenAt = new Date();
            await this.deviceRepository.save(device);

            // Create health check record
            const healthCheck = this.healthCheckRepository.create({
                deviceId: device.id,
                status: isHealthy ? "HEALTHY" : "UNHEALTHY",
                message: isHealthy ? "Device is healthy" : "Device reported error",
                metrics: {
                    isActive: isHealthy,
                    lastChecked: new Date()
                }
            });
            await this.healthCheckRepository.save(healthCheck);

            // Create log entry
            const log = this.deviceLogRepository.create({
                device,
                type: isHealthy ? LogType.INFO : LogType.ERROR,
                message: isHealthy ? "Health check passed" : "Health check failed"
            });
            await this.deviceLogRepository.save(log);

            res.json({
                device,
                healthCheck,
                log
            });
        } catch (error) {
            logger.error("Error performing health check:", error);
            res.status(500).json({ message: "Error performing health check", error });
        }
    }

    // Get device logs
    public async getDeviceLogs(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const device = await this.deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            const logs = await this.deviceLogRepository.find({
                where: { device: { id } },
                order: { created_at: "DESC" }
            });

            res.json(logs);
        } catch (error) {
            logger.error("Error fetching device logs:", error);
            res.status(500).json({ message: "Error fetching device logs", error });
        }
    }

    // Get device health checks
    public async getDeviceHealthChecks(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const device = await this.deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            const healthChecks = await this.healthCheckRepository.find({
                where: { device: { id } },
                order: { createdAt: "DESC" }
            });

            res.json(healthChecks);
        } catch (error) {
            logger.error("Error fetching device health checks:", error);
            res.status(500).json({ message: "Error fetching device health checks", error });
        }
    }
} 