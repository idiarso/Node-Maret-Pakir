import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ParkingSession } from './ParkingSession';

@Entity('parking_areas')
export class ParkingArea {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'integer' })
    capacity!: number;

    @Column({ type: 'integer', default: 0 })
    occupied_spaces!: number;

    @Column({ type: 'varchar', length: 20, default: 'active' })
    status!: string;

    @OneToMany(() => ParkingSession, session => session.parkingArea)
    parkingSessions!: ParkingSession[];

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at!: Date;
} 