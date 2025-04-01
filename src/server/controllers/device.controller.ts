import { Request, Response } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Device, DeviceType, DeviceStatus } from "../entities/Device";
import { DeviceHealthCheck } from "../entities/DeviceHealthCheck";
import { DeviceLog, LogType } from "../entities/DeviceLog";

const deviceRepository = AppDataSource.getRepository(Device);
const healthCheckRepository = AppDataSource.getRepository(DeviceHealthCheck);
const deviceLogRepository = AppDataSource.getRepository(DeviceLog);

export class DeviceController {
    // Get all devices
    static async getAllDevices(req: Request, res: Response) {
        try {
            const devices = await deviceRepository.find({
                relations: ["healthChecks", "logs"]
            });
            res.json(devices);
        } catch (error) {
            res.status(500).json({ message: "Error fetching devices", error });
        }
    }

    // Get device by ID
    static async getDeviceById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const device = await deviceRepository.findOne({
                where: { id },
                relations: ["healthChecks", "logs"]
            });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }
            
            res.json(device);
        } catch (error) {
            res.status(500).json({ message: "Error fetching device", error });
        }
    }

    // Create new device
    static async createDevice(req: Request, res: Response) {
        try {
            const { name, type, location } = req.body;
            
            if (!name || !type) {
                return res.status(400).json({ message: "Name and type are required" });
            }

            if (!Object.values(DeviceType).includes(type)) {
                return res.status(400).json({ message: "Invalid device type" });
            }

            const device = deviceRepository.create({
                name,
                type,
                location,
                status: DeviceStatus.ACTIVE
            });

            await deviceRepository.save(device);
            res.status(201).json(device);
        } catch (error) {
            res.status(500).json({ message: "Error creating device", error });
        }
    }

    // Update device
    static async updateDevice(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { name, type, location, status } = req.body;

            const device = await deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            if (name) device.name = name;
            if (type && Object.values(DeviceType).includes(type)) device.type = type;
            if (location) device.location = location;
            if (status && Object.values(DeviceStatus).includes(status)) device.status = status;

            await deviceRepository.save(device);
            res.json(device);
        } catch (error) {
            res.status(500).json({ message: "Error updating device", error });
        }
    }

    // Delete device
    static async deleteDevice(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const device = await deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            await deviceRepository.remove(device);
            res.json({ message: "Device deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting device", error });
        }
    }

    // Perform health check
    static async performHealthCheck(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const device = await deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            // Simulate health check (in real implementation, this would check actual device status)
            const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
            const status = isHealthy ? DeviceStatus.ACTIVE : DeviceStatus.ERROR;
            const errorMessage = isHealthy ? null : "Device reported error during health check";

            // Update device status
            device.status = status;
            await deviceRepository.save(device);

            // Create health check record
            const healthCheck = healthCheckRepository.create({
                device,
                status,
                error_message: errorMessage
            });
            await healthCheckRepository.save(healthCheck);

            // Create log entry
            const log = deviceLogRepository.create({
                device,
                type: isHealthy ? LogType.INFO : LogType.ERROR,
                message: isHealthy ? "Health check passed" : "Health check failed"
            });
            await deviceLogRepository.save(log);

            res.json({
                device,
                healthCheck,
                log
            });
        } catch (error) {
            res.status(500).json({ message: "Error performing health check", error });
        }
    }

    // Get device logs
    static async getDeviceLogs(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const device = await deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            const logs = await deviceLogRepository.find({
                where: { device: { id } },
                order: { created_at: "DESC" }
            });

            res.json(logs);
        } catch (error) {
            res.status(500).json({ message: "Error fetching device logs", error });
        }
    }

    // Get device health checks
    static async getDeviceHealthChecks(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const device = await deviceRepository.findOne({ where: { id } });
            
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }

            const healthChecks = await healthCheckRepository.find({
                where: { device: { id } },
                order: { checked_at: "DESC" }
            });

            res.json(healthChecks);
        } catch (error) {
            res.status(500).json({ message: "Error fetching device health checks", error });
        }
    }
} 