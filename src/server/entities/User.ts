import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { UserRole } from '../../shared/types';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column({ unique: true, nullable: true })
    username: string = '';

    @Column({ name: 'password_hash', nullable: true })
    passwordHash: string = '';

    @Column({ name: 'full_name' })
    fullName: string = '';

    @Column({ unique: true })
    email: string = '';

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.OPERATOR
    })
    role: UserRole = UserRole.OPERATOR;

    @Column({ default: true })
    active: boolean = true;

    @Column({ nullable: true, name: 'last_login' })
    lastLogin?: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date = new Date();

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date = new Date();

    constructor(partial: Partial<User>) {
        super();
        Object.assign(this, partial);
    }
} 