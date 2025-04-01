import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ParkingSession } from "./ParkingSession";

@Entity('parking_areas')
export class ParkingArea {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    location!: string;

    @Column()
    capacity!: number;

    @Column({ default: 0 })
    occupied!: number;

    @Column({ default: 'active' })
    status!: string;

    @OneToMany(() => ParkingSession, session => session.parkingArea)
    parkingSessions!: ParkingSession[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
} 