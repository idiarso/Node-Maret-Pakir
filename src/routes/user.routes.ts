import { Router, RequestHandler } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { AuthenticatedRequest, UserRole, MessageResponse, LoginResponse, UserProfile } from '../shared/types';
import { DataSource } from 'typeorm';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest extends LoginRequest {
  name: string;
  role: UserRole;
}

interface UpdateProfileRequest {
  name: string;
  currentPassword?: string;
  newPassword?: string;
}

export const createUserRouter = (dataSource: DataSource) => {
  const router = Router();
  const userController = new UserController(dataSource);

  // Public routes
  const loginHandler: RequestHandler = async (req, res) => {
    await userController.login(req as any, res);
  };
  router.post('/login', loginHandler);

  const registerHandler: RequestHandler = async (req, res) => {
    await userController.register(req as any, res);
  };
  router.post('/register', registerHandler);

  // Protected routes
  const getProfileHandler: RequestHandler = async (req, res) => {
    await userController.getProfile(req as AuthenticatedRequest, res);
  };
  router.get('/profile', authMiddleware(), getProfileHandler);

  const updateProfileHandler: RequestHandler = async (req, res) => {
    await userController.updateProfile(req as AuthenticatedRequest, res);
  };
  router.put('/profile', authMiddleware(), updateProfileHandler);

  // Admin routes
  const listUsersHandler: RequestHandler = async (req, res) => {
    await userController.listUsers(req as AuthenticatedRequest, res);
  };
  router.get('/users', authMiddleware([UserRole.ADMIN]), listUsersHandler);

  const deleteUserHandler: RequestHandler = async (req, res) => {
    await userController.deleteUser(req as AuthenticatedRequest, res);
  };
  router.delete('/users/:id', authMiddleware([UserRole.ADMIN]), deleteUserHandler);

  return router;
}; 