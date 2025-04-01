import { AppDataSource } from '../config/ormconfig';
import { User, UserRole } from '../entities/User';
import { AppError } from '../../shared/services/ErrorHandler';
import { Logger } from '../../shared/services/Logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
    private static instance: AuthService;
    private userRepository = AppDataSource.getRepository(User);
    private logger = Logger.getInstance();

    private constructor() {}

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async login(username: string, password: string): Promise<{ user: User; token: string }> {
        const user = await this.userRepository.findOne({ where: { username } });
        
        if (!user || !user.isActive) {
            throw new AppError(401, 'Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new AppError(401, 'Invalid credentials');
        }

        // Update last login
        user.lastLogin = new Date();
        await this.userRepository.save(user);

        const token = this.generateToken(user);

        return { user, token };
    }

    public async createUser(userData: {
        username: string;
        password: string;
        fullName: string;
        email: string;
        role: UserRole;
    }): Promise<User> {
        const existingUser = await this.userRepository.findOne({
            where: [
                { username: userData.username },
                { email: userData.email }
            ]
        });

        if (existingUser) {
            throw new AppError(400, 'Username or email already exists');
        }

        const passwordHash = await bcrypt.hash(userData.password, 10);
        const user = this.userRepository.create({
            ...userData,
            passwordHash
        });

        await this.userRepository.save(user);
        this.logger.info(`User created: ${user.username}`);

        return user;
    }

    public async updateUser(
        id: number,
        userData: Partial<{
            fullName: string;
            email: string;
            role: UserRole;
            isActive: boolean;
        }>
    ): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        Object.assign(user, userData);
        await this.userRepository.save(user);
        this.logger.info(`User updated: ${user.username}`);

        return user;
    }

    public async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new AppError(401, 'Invalid old password');
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);
        this.logger.info(`Password changed for user: ${user.username}`);
    }

    private generateToken(user: User): string {
        return jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
    }
} 