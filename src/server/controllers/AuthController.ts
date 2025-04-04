import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AppError } from '../../shared/services/ErrorHandler';
import { Logger } from '../../shared/services/Logger';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../shared/types';

export class AuthController {
    private static instance: AuthController;
    private authService = AuthService.getInstance();
    private logger = Logger.getInstance();

    private constructor() {}

    public static getInstance(): AuthController {
        if (!AuthController.instance) {
            AuthController.instance = new AuthController();
        }
        return AuthController.instance;
    }

    public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { username, password } = req.body;
            const { user, token } = await this.authService.login(username, password);
            
            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        fullName: user.fullName,
                        email: user.email,
                        role: user.role
                    },
                    token
                }
            });
        } catch (error) {
            next(error);
        }
    };

    public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = await this.authService.createUser(req.body);
            
            res.status(201).json({
                status: 'success',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        fullName: user.fullName,
                        email: user.email,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    };

    public updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = await this.authService.updateUser(parseInt(req.params.id), req.body);
            
            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        fullName: user.fullName,
                        email: user.email,
                        role: user.role,
                        active: user.active
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    };

    public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { oldPassword, newPassword } = req.body;
            await this.authService.changePassword(req.user!.id, oldPassword, newPassword);
            
            res.json({
                status: 'success',
                message: 'Password changed successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    public getRoutes() {
        return [
            {
                path: '/login',
                method: 'post',
                handler: [this.login]
            },
            {
                path: '/users',
                method: 'post',
                handler: [authMiddleware([UserRole.ADMIN]), this.createUser]
            },
            {
                path: '/users/:id',
                method: 'put',
                handler: [authMiddleware([UserRole.ADMIN]), this.updateUser]
            },
            {
                path: '/users/change-password',
                method: 'post',
                handler: [authMiddleware(), this.changePassword]
            }
        ];
    }
} 