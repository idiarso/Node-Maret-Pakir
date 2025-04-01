import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { GateLog } from "./GateLog";

export enum GateStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED",
    ERROR = "ERROR"
}

@Entity("gates")
export class Gate {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    type!: string;

    @Column({
        type: "enum",
        enum: GateStatus,
        default: GateStatus.CLOSED
    })
    status!: GateStatus;

    @Column({ nullable: true })
    last_maintenance?: Date;

    @OneToMany(() => GateLog, log => log.gate)
    logs!: GateLog[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
} 