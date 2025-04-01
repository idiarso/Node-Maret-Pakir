import { Router } from 'express';
import AppDataSource from '../config/ormconfig';
import { User } from '../entities/User';
import { UserRole } from '../../shared/types';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await userRepository.findOne({
      where: { username, active: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await userRepository.save(user);

    // Generate JWT token with a simpler approach
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign({ id: user.id, role: user.role }, secret);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Create new user (admin only)
router.post('/', async (req, res) => {
  try {
    const {
      username,
      password,
      fullName,
      email,
      role
    } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = userRepository.create({
      username,
      passwordHash,
      fullName,
      email,
      role: role as UserRole,
      active: true
    });

    await userRepository.save(user);

    res.status(201).json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const users = await userRepository.find({
      select: ['id', 'username', 'fullName', 'email', 'role', 'active', 'lastLogin']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user (admin or self)
router.put('/:id', async (req, res) => {
  try {
    const { fullName, email, role, isActive, password } = req.body;

    const user = await userRepository.findOne({
      where: { id: parseInt(req.params.id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (role) user.role = role as UserRole;
    if (typeof isActive === 'boolean') user.active = isActive;
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await userRepository.save(user);

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      active: user.active
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router; 