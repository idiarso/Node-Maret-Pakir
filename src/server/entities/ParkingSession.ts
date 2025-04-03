import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Ticket } from "./Ticket";
import { Vehicle } from "./Vehicle";
import { ParkingArea } from "./ParkingArea";

@Entity("parking_sessions")
export class ParkingSession {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "ticketId", nullable: true })
    ticketId?: number;

    @ManyToOne(() => Ticket, ticket => ticket.parkingSessions)
    @JoinColumn({ name: "ticketId" })
    ticket?: Ticket;

    @Column({ name: "vehicleId", nullable: true })
    vehicleId?: number;

    @ManyToOne(() => Vehicle, vehicle => vehicle.parkingSessions)
    @JoinColumn({ name: "vehicleId" })
    vehicle?: Vehicle;

    @Column({ name: "parkingAreaId", nullable: true })
    parkingAreaId?: number;

    @ManyToOne(() => ParkingArea, area => area.parkingSessions)
    @JoinColumn({ name: "parkingAreaId" })
    parkingArea?: ParkingArea;

    @Column()
    entry_time!: Date;

    @Column({ nullable: true })
    exit_time?: Date;

    @Column({ default: "ACTIVE" })
    status!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
} 