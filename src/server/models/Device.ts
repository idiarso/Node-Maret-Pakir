import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ParkingArea } from './ParkingArea';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: 'ENTRY_GATE' | 'EXIT_GATE' | 'CAMERA' | 'SENSOR';

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

  @Column({ type: 'varchar', length: 50 })
  ipAddress!: string;

  @Column({ type: 'varchar', length: 50 })
  macAddress!: string;

  @ManyToOne(() => ParkingArea)
  @JoinColumn({ name: 'parkingAreaId' })
  parkingArea!: ParkingArea;

  @Column({ type: 'uuid' })
  parkingAreaId!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  configuration!: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastPing!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<Device> = {}) {
    Object.assign(this, partial);
  }
} 