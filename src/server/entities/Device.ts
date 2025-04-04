import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { DeviceHealthCheck } from "./DeviceHealthCheck";
import { DeviceLog } from "./DeviceLog";

export enum DeviceType {
    CAMERA = "CAMERA",
    PRINTER = "PRINTER",
    SCANNER = "SCANNER",
    GATE = "GATE"
}

export enum DeviceStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    MAINTENANCE = "MAINTENANCE",
    ERROR = "ERROR"
}

@Entity("devices")
export class Device {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column()
    type!: string;

    @Column()
    location!: string;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    lastSeenAt?: Date;

    @Column({ length: 255 })
    macAddress!: string;

    @Column()
    parkingAreaId!: string;

    @Column({ type: 'jsonb', nullable: true })
    configuration?: any;

    @OneToMany(() => DeviceHealthCheck, healthCheck => healthCheck.device)
    healthChecks!: DeviceHealthCheck[];

    @OneToMany(() => DeviceLog, log => log.device)
    logs!: DeviceLog[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 