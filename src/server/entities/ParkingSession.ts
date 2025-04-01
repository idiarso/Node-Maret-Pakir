import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Ticket } from "./Ticket";
import { Vehicle } from "./Vehicle";
import { ParkingArea } from "./ParkingArea";

@Entity("parking_sessions")
export class ParkingSession {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Ticket, ticket => ticket.parkingSessions)
    ticket!: Ticket;

    @ManyToOne(() => Vehicle, vehicle => vehicle.parkingSessions)
    vehicle!: Vehicle;

    @ManyToOne(() => ParkingArea, area => area.parkingSessions)
    parkingArea!: ParkingArea;

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