import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { VehicleType } from '../../shared/types';
import { User } from './User';
import { PaymentTransaction } from './PaymentTransaction';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  ticketNumber!: string;

  @Column({
    type: 'enum',
    enum: VehicleType
  })
  vehicleType!: VehicleType;

  @Column()
  entryImagePath!: string;

  @Column()
  entryTime!: Date;

  @Column({ nullable: true })
  exitImagePath!: string;

  @Column({ nullable: true })
  exitTime!: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  entryOperator!: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  exitOperator!: User;

  @OneToOne(() => PaymentTransaction, (payment) => payment.vehicle, { nullable: true })
  @JoinColumn()
  payment!: PaymentTransaction;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: false })
  isExited!: boolean;

  constructor(partial: Partial<Vehicle> = {}) {
    Object.assign(this, partial);
  }
} 