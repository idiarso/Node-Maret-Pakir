import { User } from '../entities/User';
import { UserRole } from '../../shared/types';
import { AppDataSource } from '../config/database';
import { Logger } from '../../shared/services/Logger';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const logger = Logger.getInstance();

interface RegisterDTO {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: UserRole;
}

interface LoginDTO {
  username: string;
  password: string;
}

interface TokenPayload {
  id: number;
  username: string;
  role: UserRole;
}

export class AuthService {
  private static instance: AuthService;
  private userRepository = AppDataSource.getRepository(User);

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async register(data: RegisterDTO): Promise<User> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [
          { username: data.username },
          { email: data.email }
        ]
      });

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = this.userRepository.create({
        ...data,
        passwordHash,
        active: true
      });

      await this.userRepository.save(user);
      return user;
    } catch (error) {
      logger.error('Error in register:', error);
      throw error;
    }
  }

  public async login(data: LoginDTO): Promise<{ token: string; user: TokenPayload }> {
    try {
      const user = await this.userRepository.findOne({
        where: { username: data.username }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.active) {
        throw new Error('User is inactive');
      }

      const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Update last login
      user.lastLogin = new Date();
      await this.userRepository.save(user);

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      };
    } catch (error) {
      logger.error('Error in login:', error);
      throw error;
    }
  }

  public async validateToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as TokenPayload;
      const user = await this.userRepository.findOne({
        where: { id: decoded.id }
      });

      if (!user || !user.active) {
        throw new Error('Invalid token');
      }

      return {
        id: user.id,
        username: user.username,
        role: user.role
      };
    } catch (error) {
      logger.error('Error in validateToken:', error);
      throw error;
    }
  }
} 