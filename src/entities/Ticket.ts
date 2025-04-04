import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ParkingSession } from './ParkingSession';

@Entity('tickets')
export class Ticket {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    barcode!: string;

    @Column({ name: 'parking_session_id' })
    parking_session_id!: number;

    @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
    status!: string;

    @OneToOne(() => ParkingSession)
    @JoinColumn({ name: 'parking_session_id' })
    parkingSession!: ParkingSession;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at!: Date;
} 