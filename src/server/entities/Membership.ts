import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Vehicle } from "./Vehicle";

@Entity("memberships")
export class Membership {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Vehicle, vehicle => vehicle.memberships)
    vehicle!: Vehicle;

    @Column()
    type!: string;

    @Column()
    start_date!: Date;

    @Column({ nullable: true })
    end_date?: Date;

    @Column({ default: "ACTIVE" })
    status!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
} 