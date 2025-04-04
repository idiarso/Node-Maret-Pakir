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
    ERROR = "ERROR"
}

@Entity("gates")
export class Gate {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ name: 'gate_number' })
    gate_number!: string;

    @Column({ nullable: true })
    location?: string;

    @Column({
        type: "enum",
        enum: GateType,
        default: GateType.ENTRY
    })
    type!: string;

    @Column({
        type: "enum",
        enum: GateStatus,
        default: GateStatus.INACTIVE
    })
    status!: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    hardware_config?: string;

    @Column({ type: 'jsonb', nullable: true, default: {} })
    maintenance_schedule?: {
        last_maintenance?: Date;
        next_maintenance?: Date;
        maintenance_notes?: string;
    };

    @Column({ type: 'jsonb', nullable: true, default: {} })
    error_log?: {
        last_error?: string;
        error_count?: number;
        last_error_time?: Date;
    };

    @Column({ default: true })
    is_active!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;

    @OneToMany(() => GateLog, log => log.gate)
    logs!: GateLog[];
} 