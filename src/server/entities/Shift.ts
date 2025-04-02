import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export enum ShiftStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}

@Entity("shift_summaries")
export class Shift {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    operator_id!: number;

    @Column({ type: 'timestamp with time zone' })
    shift_start!: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    shift_end?: Date;

    @Column({ default: 0 })
    total_transactions!: number;

    @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
    total_amount!: number;

    @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
    cash_amount!: number;

    @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
    non_cash_amount!: number;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at!: Date;
} 