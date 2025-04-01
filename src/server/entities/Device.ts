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
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({
        type: "enum",
        enum: DeviceType
    })
    type!: DeviceType;

    @Column({ nullable: true })
    location?: string;

    @Column({
        type: "enum",
        enum: DeviceStatus,
        default: DeviceStatus.ACTIVE
    })
    status!: DeviceStatus;

    @Column({ nullable: true })
    last_maintenance?: Date;

    @Column({ nullable: true })
    next_maintenance?: Date;

    @OneToMany(() => DeviceHealthCheck, healthCheck => healthCheck.device)
    healthChecks!: DeviceHealthCheck[];

    @OneToMany(() => DeviceLog, log => log.device)
    logs!: DeviceLog[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
} 