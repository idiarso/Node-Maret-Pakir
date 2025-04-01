import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { Gate } from "./Gate";
import { User } from "./User";

@Entity("gate_logs")
export class GateLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Gate, gate => gate.logs)
    gate!: Gate;

    @Column()
    action!: string;

    @Column()
    status!: string;

    @ManyToOne(() => User)
    operator!: User;

    @CreateDateColumn()
    created_at!: Date;
} 