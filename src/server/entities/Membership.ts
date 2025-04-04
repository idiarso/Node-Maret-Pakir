import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Vehicle } from "./Vehicle";

@Entity("memberships")
export class Membership {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "vehicleId" })
    vehicleId!: number;

    @ManyToOne(() => Vehicle, vehicle => vehicle.memberships)
    @JoinColumn({ name: "vehicleId" })
    vehicle!: Vehicle;

    @Column()
    type!: string;

    @Column()
    start_date!: Date;

    @Column()
    end_date!: Date;

    @Column({ default: true })
    active!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
} 