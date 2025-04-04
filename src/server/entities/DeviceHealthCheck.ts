import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Device } from './Device';

@Entity('device_health_checks')
export class DeviceHealthCheck {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'device_id' })
    deviceId!: string;

    @ManyToOne(() => Device, device => device.healthChecks)
    @JoinColumn({ name: 'device_id' })
    device!: Device;

    @Column()
    status!: string;

    @Column({ type: 'jsonb', nullable: true })
    metrics: any;

    @Column({ type: 'text', nullable: true })
    message!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    constructor(partial: Partial<DeviceHealthCheck>) {
        Object.assign(this, partial);
    }
} 