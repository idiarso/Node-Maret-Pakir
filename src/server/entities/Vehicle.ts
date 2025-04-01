import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from "typeorm";
import { ParkingSession } from "./ParkingSession";
import { Membership } from "./Membership";
import { PaymentTransaction } from "./PaymentTransaction";

@Entity("vehicles")
export class Vehicle {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    plate_number!: string;

    @Column()
    type!: string;

    @Column({ nullable: true })
    owner_name?: string;

    @Column({ nullable: true })
    owner_contact?: string;

    @Column({ nullable: true })
    registration_date?: Date;

    @OneToMany(() => ParkingSession, session => session.vehicle)
    parkingSessions!: ParkingSession[];

    @OneToMany(() => Membership, membership => membership.vehicle)
    memberships!: Membership[];

    @OneToOne(() => PaymentTransaction, payment => payment.vehicle)
    payment!: PaymentTransaction;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
} 