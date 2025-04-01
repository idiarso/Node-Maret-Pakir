import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, BaseEntity } from 'typeorm';
import { User } from './User';
import { VehicleType } from './VehicleType';
import { ParkingSession } from './ParkingSession';
import { TicketStatus } from '../../shared/types';

@Entity('tickets')
export class Ticket extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column({ unique: true })
    ticketNumber: string = '';

    @Column()
    plateNumber: string = '';

    @Column({ name: 'vehicle_type_id' })
    vehicleTypeId: number = 0;

    @ManyToOne(() => VehicleType)
    @JoinColumn({ name: 'vehicle_type_id' })
    vehicleType!: VehicleType;

    @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ACTIVE })
    status: TicketStatus = TicketStatus.ACTIVE;

    @Column({ name: 'entry_time' })
    entryTime: Date = new Date();

    @Column({ name: 'exit_time', nullable: true })
    exitTime?: Date;

    @Column({ name: 'created_by' })
    createdBy: number = 0;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    creator!: User;

    @OneToMany(() => ParkingSession, session => session.ticket)
    parkingSessions!: ParkingSession[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date = new Date();

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date = new Date();

    constructor(partial: Partial<Ticket>) {
        super();
        Object.assign(this, partial);
    }
} 