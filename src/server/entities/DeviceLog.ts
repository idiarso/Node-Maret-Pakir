import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { Device } from "./Device";

export enum LogType {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    DEBUG = "DEBUG"
}

@Entity("device_logs")
export class DeviceLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, device => device.logs)
    device!: Device;

    @Column({
        type: "enum",
        enum: LogType
    })
    type!: LogType;

    @Column()
    message!: string;

    @CreateDateColumn()
    created_at!: Date;
} 