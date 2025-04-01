import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../shared/types';
import { UserRole } from '../shared/types';
import { User } from '../server/entities/User';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: UserRole;
    name: string;
  };
}

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

interface MessageResponse {
  message: string;
}

export class UserController {
  private userRepository;

  constructor(private dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
  }

  public login = async (req: Request, res: Response<LoginResponse | MessageResponse>) => {
    try {
      const { email, password } = req.body;

      const user = await this.userRepository.findOne({ where: { email } });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.fullName
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  public register = async (req: Request, res: Response<LoginResponse | MessageResponse>) => {
    try {
      const { email, password, name, role } = req.body;

      const existingUser = await this.userRepository.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        email,
        passwordHash: hashedPassword,
        fullName: name,
        role,
        username: email // Using email as username for now
      });

      await this.userRepository.save(user);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.fullName
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  public getProfile = async (req: AuthenticatedRequest, res: Response<UserProfile | MessageResponse>) => {
    try {
      const userId = req.user?.id;

      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  public updateProfile = async (req: AuthenticatedRequest, res: Response<MessageResponse>) => {
    try {
      const userId = req.user?.id;
      const { name, currentPassword, newPassword } = req.body;

      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (newPassword) {
        if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
          return res.status(401).json({ message: 'Invalid current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.passwordHash = hashedPassword;
      }

      user.fullName = name;
      await this.userRepository.save(user);

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  public listUsers = async (req: AuthenticatedRequest, res: Response<UserProfile[] | MessageResponse>) => {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const users = await this.userRepository.find({
        select: ['id', 'email', 'fullName', 'role']
      });

      res.json(users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role
      })));
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  public deleteUser = async (req: AuthenticatedRequest, res: Response<MessageResponse>) => {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const { id } = req.params;

      const result = await this.userRepository.delete(id);

      if (result.affected === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}