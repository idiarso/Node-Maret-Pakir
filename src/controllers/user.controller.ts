import { Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../shared/types';
import { UserRole } from '../shared/types';

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
  constructor(private db: Pool) {}

  public login = async (req: Request, res: Response<LoginResponse | MessageResponse>) => {
    try {
      const { email, password } = req.body;

      const result = await this.db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
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
          name: user.name
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  public register = async (req: Request, res: Response<LoginResponse | MessageResponse>) => {
    try {
      const { email, password, name, role } = req.body;

      const existingUser = await this.db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await this.db.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role, name',
        [email, hashedPassword, name, role]
      );

      const user = result.rows[0];
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
          name: user.name
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  public getProfile = async (req: AuthenticatedRequest, res: Response<UserProfile | MessageResponse>) => {
    try {
      const userId = req.user?.id;

      const result = await this.db.query(
        'SELECT id, email, name, role FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  public updateProfile = async (req: AuthenticatedRequest, res: Response<MessageResponse>) => {
    try {
      const userId = req.user?.id;
      const { name, currentPassword, newPassword } = req.body;

      const user = await this.db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (newPassword) {
        if (!(await bcrypt.compare(currentPassword, user.rows[0].password))) {
          return res.status(401).json({ message: 'Invalid current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.db.query(
          'UPDATE users SET name = $1, password = $2 WHERE id = $3',
          [name, hashedPassword, userId]
        );
      } else {
        await this.db.query(
          'UPDATE users SET name = $1 WHERE id = $2',
          [name, userId]
        );
      }

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

      const result = await this.db.query(
        'SELECT id, email, name, role FROM users ORDER BY id'
      );

      res.json(result.rows);
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

      const result = await this.db.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
} 