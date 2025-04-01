import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

// Define the enum for vehicle types
export enum VehicleType {
    CAR = "CAR",
    MOTORCYCLE = "MOTORCYCLE",
    TRUCK = "TRUCK",
    VAN = "VAN"
}

@Entity("parking_rates")
export class ParkingRate {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'enum',
        enum: VehicleType
    })
    vehicle_type!: string;

    @Column("decimal", { precision: 10, scale: 2 })
    base_rate!: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true, default: 0 })
    hourly_rate?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    daily_rate?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    weekly_rate?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    monthly_rate?: number;

    @Column({ nullable: true })
    grace_period?: number;

    @Column({ nullable: true })
    is_weekend_rate?: boolean;

    @Column({ nullable: true })
    is_holiday_rate?: boolean;

    @Column({ type: 'date' })
    effective_from!: Date;

    @Column({ type: 'date', nullable: true })
    effective_to?: Date;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at!: Date;
} 