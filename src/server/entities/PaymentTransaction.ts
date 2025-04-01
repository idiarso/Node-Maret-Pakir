import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Vehicle } from './Vehicle';
import { PaymentMethod, PaymentStatus } from '../../shared/types';

@Entity()
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  paymentStatus!: PaymentStatus;

  @ManyToOne(() => User)
  @JoinColumn()
  operator!: User;

  @OneToOne(() => Vehicle, vehicle => vehicle.payment)
  @JoinColumn()
  vehicle!: Vehicle;

  @Column({ unique: true })
  receiptNumber!: string;

  @Column({ nullable: true })
  notes!: string;

  @CreateDateColumn()
  transactionTime!: Date;

  constructor(partial: Partial<PaymentTransaction> = {}) {
    Object.assign(this, partial);
  }
} 