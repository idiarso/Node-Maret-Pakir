import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';

@Entity('vehicle_types')
export class VehicleType extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column()
    name: string = '';

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number = 0;

    @Column({ default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date = new Date();

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date = new Date();

    constructor(partial: Partial<VehicleType>) {
        super();
        Object.assign(this, partial);
    }
} 