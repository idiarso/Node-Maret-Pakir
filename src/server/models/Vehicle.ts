import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  licensePlate!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: 'CAR' | 'MOTORCYCLE' | 'TRUCK';

  @Column({ type: 'varchar', length: 50, nullable: true })
  brand!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  model!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<Vehicle> = {}) {
    Object.assign(this, partial);
  }
} 