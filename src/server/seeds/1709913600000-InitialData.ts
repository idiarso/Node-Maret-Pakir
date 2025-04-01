import { MigrationInterface, QueryRunner } from 'typeorm';
import { hash } from 'bcryptjs';
import { User } from '../entities/User';
import { UserRole } from '../../shared/types';
import AppDataSource from '../config/ormconfig';

export class InitialData1709913600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const userRepository = AppDataSource.getRepository(User);

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            passwordHash: await hash('admin123', 10),
            fullName: 'System Administrator',
            email: 'admin@example.com',
            role: UserRole.ADMIN,
            active: true
        });

        await userRepository.save(adminUser);

        // Create operator user
        const operatorUser = new User({
            username: 'operator',
            passwordHash: await hash('operator123', 10),
            fullName: 'System Operator',
            email: 'operator@example.com',
            role: UserRole.OPERATOR,
            active: true
        });

        await userRepository.save(operatorUser);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const userRepository = AppDataSource.getRepository(User);
        await userRepository.delete({});
    }
} 