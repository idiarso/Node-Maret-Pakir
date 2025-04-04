import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('parking_areas')
export class ParkingArea {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'integer' })
  capacity!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: 'INDOOR' | 'OUTDOOR';

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourlyRate!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<ParkingArea> = {}) {
    Object.assign(this, partial);
  }
} 