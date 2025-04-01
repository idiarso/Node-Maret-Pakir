import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { Device, DeviceStatus } from "./Device";

@Entity("device_health_checks")
export class DeviceHealthCheck {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, device => device.healthChecks)
    device!: Device;

    @Column({
        type: "enum",
        enum: DeviceStatus,
        enumName: "device_status"
    })
    status!: DeviceStatus;

    @Column({ nullable: true })
    error_message?: string;

    @CreateDateColumn()
    checked_at!: Date;
} 