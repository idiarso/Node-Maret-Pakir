import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { User } from './User';
import { Ticket } from './Ticket';
import { PaymentStatus, PaymentMethod } from '../../shared/types';

@Entity('payments')
export class Payment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column({ name: 'ticket_id' })
    ticketId: number = 0;

    @ManyToOne(() => Ticket)
    @JoinColumn({ name: 'ticket_id' })
    ticket!: Ticket;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number = 0;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status: PaymentStatus = PaymentStatus.PENDING;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        nullable: true
    })
    paymentMethod?: PaymentMethod;

    @Column({ nullable: true })
    transactionId?: string;

    @Column({ name: 'paid_by' })
    paidBy: number = 0;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'paid_by' })
    operator!: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date = new Date();

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date = new Date();

    constructor(partial: Partial<Payment>) {
        super();
        Object.assign(this, partial);
    }
} 