import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { Vehicle } from "./Vehicle";

@Entity("payment_transactions")
export class PaymentTransaction {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "vehicleId" })
    vehicleId!: number;

    @OneToOne(() => Vehicle, vehicle => vehicle.payment)
    @JoinColumn({ name: "vehicleId" })
    vehicle!: Vehicle;

    @Column()
    amount!: number;

    @Column()
    payment_method!: string;

    @Column()
    transaction_date!: Date;

    @Column({ default: "PENDING" })
    status!: string;

    @Column({ nullable: true })
    reference_number?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
} 