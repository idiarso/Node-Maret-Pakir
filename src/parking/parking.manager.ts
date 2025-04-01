import { EventEmitter } from 'events';
import { PaymentTransaction } from '../payment/payment.interface';

export interface ParkingSpace {
    id: string;
    number: string;
    type: 'car' | 'motorcycle' | 'truck' | 'bus';
    status: 'available' | 'occupied' | 'maintenance' | 'payment_pending' | 'reserved';
    currentVehicle?: {
        id: string;
        type: 'car' | 'motorcycle' | 'truck' | 'bus';
        plateNumber: string;
        entryTime: Date;
        ticketId?: string;
    };
    location?: {
        floor: number;
        section: string;
        coordinates: { x: number; y: number };
    };
    gateId?: string;
}

export interface ParkingZone {
    id: string;
    name: string;
    type: 'car' | 'motorcycle' | 'truck' | 'bus';
    spaces: ParkingSpace[];
    capacity: number;
    currentOccupancy: number;
}

export interface ParkingStats {
    totalSpaces: number;
    occupiedSpaces: number;
    availableSpaces: number;
    occupancyRate: number;
    revenue: {
        daily: number;
        weekly: number;
        monthly: number;
    };
    vehicleTypes: {
        [key: string]: {
            total: number;
            occupied: number;
            available: number;
        };
    };
}

export class ParkingManager extends EventEmitter {
    private zones: Map<string, ParkingZone> = new Map();
    private spaces: Map<string, ParkingSpace> = new Map();
    private vehicles: Map<string, ParkingSpace> = new Map();
    private stats: ParkingStats;

    constructor() {
        super();
        this.stats = this.initializeStats();
        this.startStatsUpdate();
    }

    public async initializeParkingLot(config: {
        zones: {
            id: string;
            name: string;
            type: 'car' | 'motorcycle' | 'truck' | 'bus';
            capacity: number;
            location?: {
                floor: number;
                section: string;
            };
        }[];
    }): Promise<void> {
        for (const zoneConfig of config.zones) {
            const zone = await this.createZone(zoneConfig);
            this.zones.set(zone.id, zone);
        }

        this.updateStats();
        this.emit('parkingLotInitialized', {
            zones: Array.from(this.zones.values()),
            stats: this.stats
        });
    }

    public async assignSpace(
        plateNumber: string,
        vehicleType: 'car' | 'motorcycle' | 'truck' | 'bus',
        ticketId?: string
    ): Promise<ParkingSpace> {
        const availableSpace = this.findAvailableSpace(vehicleType);
        if (!availableSpace) {
            throw new Error(`No available spaces for vehicle type: ${vehicleType}`);
        }

        availableSpace.status = 'occupied';
        availableSpace.currentVehicle = {
            id: `VEH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: vehicleType,
            plateNumber,
            entryTime: new Date(),
            ticketId
        };

        this.spaces.set(availableSpace.id, availableSpace);
        this.vehicles.set(plateNumber, availableSpace);

        this.updateStats();
        this.emit('spaceAssigned', {
            space: availableSpace,
            vehicle: {
                plateNumber,
                vehicleType,
                ticketId
            }
        });

        return availableSpace;
    }

    public async releaseSpace(plateNumber: string): Promise<void> {
        const space = this.vehicles.get(plateNumber);
        if (!space) {
            throw new Error(`No vehicle found with plate number: ${plateNumber}`);
        }

        space.status = 'available';
        space.currentVehicle = undefined;

        this.spaces.set(space.id, space);
        this.vehicles.delete(plateNumber);

        this.updateStats();
        this.emit('spaceReleased', {
            space,
            plateNumber
        });
    }

    public async reserveSpace(
        spaceId: string,
        duration: number
    ): Promise<ParkingSpace> {
        const space = this.spaces.get(spaceId);
        if (!space) {
            throw new Error(`Space not found: ${spaceId}`);
        }

        if (space.status !== 'available') {
            throw new Error(`Space is not available: ${spaceId}`);
        }

        space.status = 'reserved';
        this.spaces.set(spaceId, space);

        // Auto-release after duration
        setTimeout(() => {
            if (space.status === 'reserved') {
                this.releaseSpace(spaceId);
            }
        }, duration);

        this.emit('spaceReserved', {
            space,
            duration
        });

        return space;
    }

    public async markSpaceMaintenance(
        spaceId: string,
        reason: string
    ): Promise<ParkingSpace> {
        const space = this.spaces.get(spaceId);
        if (!space) {
            throw new Error(`Space not found: ${spaceId}`);
        }

        if (space.status === 'occupied') {
            throw new Error(`Cannot mark occupied space for maintenance: ${spaceId}`);
        }

        space.status = 'maintenance';
        this.spaces.set(spaceId, space);

        this.emit('spaceMaintenance', {
            space,
            reason
        });

        return space;
    }

    public getSpace(spaceId: string): ParkingSpace | undefined {
        return this.spaces.get(spaceId);
    }

    public getVehicleSpace(plateNumber: string): ParkingSpace | undefined {
        return this.vehicles.get(plateNumber);
    }

    public getZone(zoneId: string): ParkingZone | undefined {
        return this.zones.get(zoneId);
    }

    public getStats(): ParkingStats {
        return { ...this.stats };
    }

    public async getParkingSpace(id: string): Promise<ParkingSpace | null> {
        for (const zone of this.zones.values()) {
            const space = zone.spaces.find(s => s.id === id);
            if (space) {
                return space;
            }
        }
        return null;
    }

    public async updateSpaceStatus(
        spaceId: string,
        status: ParkingSpace['status']
    ): Promise<void> {
        for (const zone of this.zones.values()) {
            const spaceIndex = zone.spaces.findIndex(s => s.id === spaceId);
            if (spaceIndex !== -1) {
                zone.spaces[spaceIndex].status = status;
                this.emit('space_status_updated', {
                    spaceId,
                    status,
                    zoneId: zone.id
                });
                return;
            }
        }
        throw new Error('Parking space not found');
    }

    public async openGate(gateId: string): Promise<void> {
        // Implement gate control logic here
        this.emit('gate_opened', { gateId });
    }

    public async closeGate(gateId: string): Promise<void> {
        // Implement gate control logic here
        this.emit('gate_closed', { gateId });
    }

    private async createZone(config: {
        id: string;
        name: string;
        type: 'car' | 'motorcycle' | 'truck' | 'bus';
        capacity: number;
        location?: {
            floor: number;
            section: string;
            coordinates?: { x: number; y: number };
        };
    }): Promise<ParkingZone> {
        const spaces: ParkingSpace[] = [];
        for (let i = 1; i <= config.capacity; i++) {
            const space: ParkingSpace = {
                id: `${config.id}_${i}`,
                number: `${config.type.toUpperCase()}${i}`,
                type: config.type,
                status: 'available',
                location: config.location ? {
                    ...config.location,
                    coordinates: config.location.coordinates || { x: 0, y: 0 }
                } : undefined
            };
            spaces.push(space);
            this.spaces.set(space.id, space);
        }

        const zone: ParkingZone = {
            id: config.id,
            name: config.name,
            type: config.type,
            spaces,
            capacity: config.capacity,
            currentOccupancy: 0
        };

        return zone;
    }

    private findAvailableSpace(
        vehicleType: 'car' | 'motorcycle' | 'truck' | 'bus'
    ): ParkingSpace | undefined {
        return Array.from(this.spaces.values()).find(
            space => space.type === vehicleType && space.status === 'available'
        );
    }

    private initializeStats(): ParkingStats {
        return {
            totalSpaces: 0,
            occupiedSpaces: 0,
            availableSpaces: 0,
            occupancyRate: 0,
            revenue: {
                daily: 0,
                weekly: 0,
                monthly: 0
            },
            vehicleTypes: {
                car: { total: 0, occupied: 0, available: 0 },
                motorcycle: { total: 0, occupied: 0, available: 0 },
                truck: { total: 0, occupied: 0, available: 0 },
                bus: { total: 0, occupied: 0, available: 0 }
            }
        };
    }

    private updateStats(): void {
        const stats = this.initializeStats();

        // Count spaces by type and status
        for (const space of this.spaces.values()) {
            stats.totalSpaces++;
            stats.vehicleTypes[space.type].total++;

            if (space.status === 'occupied') {
                stats.occupiedSpaces++;
                stats.vehicleTypes[space.type].occupied++;
            } else if (space.status === 'available') {
                stats.availableSpaces++;
                stats.vehicleTypes[space.type].available++;
            }
        }

        // Calculate occupancy rate
        stats.occupancyRate = (stats.occupiedSpaces / stats.totalSpaces) * 100;

        this.stats = stats;
        this.emit('statsUpdated', stats);
    }

    private startStatsUpdate(): void {
        // Update stats every minute
        setInterval(() => {
            this.updateStats();
        }, 60000);
    }
} 