import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { ParkingSession } from "./ParkingSession";

@Entity("parking_areas")
export class ParkingArea {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    capacity: number;

    @Column({ default: 0 })
    occupied: number;

    @Column({ default: "ACTIVE" })
    status: string;

    @OneToMany(() => ParkingSession, session => session.parkingArea)
    parkingSessions: ParkingSession[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
} 