import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { Ticket } from './Ticket';
import { User } from './User';
import { ParkingArea } from './ParkingArea';
import { Vehicle } from './Vehicle';

@Entity('parking_sessions')
export class ParkingSession {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp with time zone', nullable: false })
    entry_time!: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    exit_time?: Date;

    @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
    status!: string;

    @Column({ name: 'entry_operator_id' })
    entry_operator_id!: number;

    @Column({ name: 'exit_operator_id', nullable: true })
    exit_operator_id?: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'entry_operator_id' })
    entryOperator!: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'exit_operator_id' })
    exitOperator?: User;

    @ManyToOne(() => Vehicle)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle?: Vehicle;

    @ManyToOne(() => ParkingArea)
    @JoinColumn({ name: 'parking_area_id' })
    parkingArea?: ParkingArea;

    @OneToOne(() => Ticket, (ticket: Ticket) => ticket.parkingSession)
    ticket?: Ticket;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at!: Date;
} 