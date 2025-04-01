import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { User } from './User';

export enum AuditAction {
    // User actions
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
    USER_CREATE = 'USER_CREATE',
    USER_UPDATE = 'USER_UPDATE',
    USER_DELETE = 'USER_DELETE',
    
    // Ticket actions
    TICKET_CREATE = 'TICKET_CREATE',
    TICKET_UPDATE = 'TICKET_UPDATE',
    TICKET_DELETE = 'TICKET_DELETE',
    
    // Payment actions
    PAYMENT_CREATE = 'PAYMENT_CREATE',
    PAYMENT_UPDATE = 'PAYMENT_UPDATE',
    PAYMENT_COMPLETE = 'PAYMENT_COMPLETE',
    PAYMENT_FAIL = 'PAYMENT_FAIL',
    
    // Gate actions
    GATE_OPEN = 'GATE_OPEN',
    GATE_CLOSE = 'GATE_CLOSE',
    
    // System actions
    SYSTEM_ERROR = 'SYSTEM_ERROR',
    SYSTEM_CONFIG_UPDATE = 'SYSTEM_CONFIG_UPDATE'
}

export enum EntityType {
    USER = 'USER',
    TICKET = 'TICKET',
    PAYMENT = 'PAYMENT',
    GATE = 'GATE',
    SYSTEM = 'SYSTEM'
}

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column({
        type: 'enum',
        enum: AuditAction
    })
    action: AuditAction = AuditAction.SYSTEM_ERROR;

    @Column({
        type: 'enum',
        enum: EntityType
    })
    entityType: EntityType = EntityType.SYSTEM;

    @Column({ nullable: true })
    entityId?: string;

    @Column({ type: 'jsonb', nullable: true })
    oldData?: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    newData?: Record<string, any>;

    @Column()
    description: string = '';

    @Column({ nullable: true })
    ipAddress?: string;

    @Column({ nullable: true })
    userAgent?: string;

    @Column({ name: 'user_id', nullable: true })
    userId?: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date = new Date();

    constructor(partial?: Partial<AuditLog>) {
        super();
        Object.assign(this, partial);
    }

    static async log(data: {
        action: AuditAction;
        entityType: EntityType;
        entityId?: string;
        oldData?: Record<string, any>;
        newData?: Record<string, any>;
        description: string;
        userId?: number;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuditLog> {
        const log = new AuditLog({
            ...data,
            createdAt: new Date()
        });
        return await log.save();
    }

    static async getRecentLogs(limit: number = 50): Promise<AuditLog[]> {
        return await AuditLog.find({
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['user']
        });
    }

    static async getLogsByUser(userId: number, limit: number = 50): Promise<AuditLog[]> {
        return await AuditLog.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['user']
        });
    }

    static async getLogsByEntity(entityType: EntityType, entityId: string, limit: number = 50): Promise<AuditLog[]> {
        return await AuditLog.find({
            where: { entityType, entityId },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['user']
        });
    }
} 