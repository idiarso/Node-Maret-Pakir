import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { UserRole } from '../../shared/types';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;

  @Column()
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ nullable: true })
  lastLogin?: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OPERATOR
  })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }
} 