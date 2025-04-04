import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from './Vehicle';
import { ParkingArea } from './ParkingArea';
import { Device } from './Device';

@Entity('parking_sessions')
export class ParkingSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @ManyToOne(() => ParkingArea)
  @JoinColumn({ name: 'parkingAreaId' })
  parkingArea!: ParkingArea;

  @Column({ type: 'uuid' })
  parkingAreaId!: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'entryDeviceId' })
  entryDevice!: Device;

  @Column({ type: 'uuid' })
  entryDeviceId!: string;

  @ManyToOne(() => Device, { nullable: true })
  @JoinColumn({ name: 'exitDeviceId' })
  exitDevice!: Device;

  @Column({ type: 'uuid', nullable: true })
  exitDeviceId!: string;

  @Column({ type: 'timestamp' })
  entryTime!: Date;

  @Column({ type: 'timestamp', nullable: true })
  exitTime!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee!: number;

  @Column({ type: 'varchar', length: 50 })
  status!: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<ParkingSession> = {}) {
    Object.assign(this, partial);
  }
} 