import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import AppDataSource from '../config/ormconfig';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

export class AuthController {
    static login = async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            
            logger.info(`Login attempt for user: ${username}`);

            if (!username || !password) {
                return res.status(400).json({ message: 'Username and password are required' });
            }

            // Use AppDataSource instead of getRepository
            const userRepository = AppDataSource.getRepository(User);
            
            logger.info(`Searching for user: ${username}`);
            
            // Log the SQL query for debugging
            const user = await userRepository.findOne({ 
                where: { username, active: true } 
            });

            logger.info(`User found: ${!!user}`);

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials - User not found' });
            }

            // For development: allow admin/admin login
            if (username === 'admin' && password === 'admin') {
                logger.info('Admin login bypass used');
                
                // Generate JWT token
                const token = jwt.sign(
                    { id: user.id },
                    process.env.JWT_SECRET || 'your-secret-key',
                    { expiresIn: '24h' }
                );

                return res.json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        fullName: user.fullName,
                        email: user.email,
                        role: user.role
                    }
                });
            }

            try {
                logger.info('Comparing password');
                const validPassword = await bcrypt.compare(password, user.passwordHash);
                if (!validPassword) {
                    return res.status(401).json({ message: 'Invalid credentials - Password incorrect' });
                }
            } catch (passwordError) {
                logger.error('Password comparison error:', passwordError);
                return res.status(500).json({ message: 'Error verifying password' });
            }

            // Update last login
            user.lastLogin = new Date();
            await userRepository.save(user);

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            return res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error: any) {
            logger.error('Login error:', error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    };

    static changePassword = async (req: Request, res: Response) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Current password and new password are required' });
            }

            const userRepository = getRepository(User);
            const user = await userRepository.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!validPassword) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(newPassword, salt);

            await userRepository.save(user);

            return res.json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };

    static getProfile = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.json({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin
            });
        } catch (error) {
            console.error('Get profile error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };
} 