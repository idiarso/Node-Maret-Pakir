import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from "typeorm";
import { GateLog } from "./GateLog";

export enum GateType {
    ENTRY = "ENTRY",
    EXIT = "EXIT"
}

export enum GateStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    MAINTENANCE = "MAINTENANCE",
    ERROR = "ERROR",
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}

@Entity("gates")
export class Gate {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 50 })
    name!: string;

    @Column({ length: 20, nullable: true })
    gate_number!: string;

    @Column({
        type: "enum",
        enum: GateType,
        nullable: false,
        default: GateType.ENTRY
    })
    type!: GateType;

    @Column({
        type: "enum",
        enum: GateStatus,
        default: GateStatus.INACTIVE,
        nullable: false
    })
    status!: GateStatus;

    @Column({ length: 100, nullable: true })
    location!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'jsonb', nullable: true })
    hardware_config!: {
        ip_address?: string;
        port?: number;
        device_id?: string;
        last_communication?: Date;
    };

    @Column({ type: 'jsonb', nullable: true })
    maintenance_schedule!: {
        last_maintenance?: Date;
        next_maintenance?: Date;
        maintenance_notes?: string;
    };

    @Column({ type: 'jsonb', nullable: true })
    error_log!: {
        last_error?: string;
        error_count?: number;
        last_error_time?: Date;
    };

    @Column({ default: true })
    is_active!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @OneToMany(() => GateLog, log => log.gate)
    logs!: GateLog[];
} 