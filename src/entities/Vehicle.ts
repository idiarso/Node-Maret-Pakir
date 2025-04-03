import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ParkingSession } from './ParkingSession';
import { VehicleType } from '../utils/constants';

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 20, unique: true })
    plate_number!: string;

    @Column({ type: 'enum', enum: VehicleType })
    type!: VehicleType;

    @Column({ type: 'varchar', length: 255 })
    owner_name!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    owner_contact?: string;

    @Column({ type: 'date' })
    registration_date!: Date;

    @Column({ type: 'varchar', length: 20, default: 'active' })
    status!: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @OneToMany(() => ParkingSession, session => session.vehicle)
    parkingSessions!: ParkingSession[];

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at!: Date;
} 