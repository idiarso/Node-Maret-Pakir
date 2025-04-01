import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum GateType {
    ENTRY = "ENTRY",
    EXIT = "EXIT",
    BOTH = "BOTH"
}

export enum GateStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    MAINTENANCE = "MAINTENANCE"
}

@Entity("gates")
export class Gate {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    name!: string;

    @Column({
        type: "enum",
        enum: GateType,
        default: GateType.BOTH
    })
    type!: GateType;

    @Column({ length: 255 })
    location!: string;

    @Column({
        type: "enum",
        enum: GateStatus,
        default: GateStatus.ACTIVE
    })
    status!: GateStatus;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
} 