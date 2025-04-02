import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

// Define the enum for vehicle types
export enum VehicleType {
    CAR = "CAR",
    MOTORCYCLE = "MOTORCYCLE",
    TRUCK = "TRUCK",
    VAN = "VAN",
    BUS = "BUS"
}

@Entity("parking_rates")
@Index(['vehicle_type', 'effective_from', 'effective_to'])
@Index(['is_weekend_rate', 'is_holiday_rate'])
export class ParkingRate {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'enum',
        enum: VehicleType,
        nullable: false
    })
    vehicle_type!: VehicleType;

    @Column("decimal", { precision: 10, scale: 2, nullable: false })
    base_rate!: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true, default: 0 })
    hourly_rate?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    daily_rate?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    weekly_rate?: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    monthly_rate?: number;

    @Column({ nullable: true, default: 15 })
    grace_period?: number;

    @Column({ default: false })
    is_weekend_rate?: boolean;

    @Column({ default: false })
    is_holiday_rate?: boolean;

    @Column({ type: 'timestamp', nullable: false })
    effective_from!: Date;

    @Column({ type: 'timestamp', nullable: true })
    effective_to?: Date;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at!: Date;
}