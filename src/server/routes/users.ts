import { Router } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';
import { UserRole } from '../../shared/types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const userRepository = getRepository(User);
    const user = await userRepository.findOne({
      where: { username, isActive: true }
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

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

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

    const userRepository = getRepository(User);
    const user = userRepository.create({
      username,
      passwordHash,
      fullName,
      email,
      role: role as UserRole,
      isActive: true
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
    const userRepository = getRepository(User);
    const users = await userRepository.find({
      select: ['id', 'username', 'fullName', 'email', 'role', 'isActive', 'lastLogin']
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
    const userRepository = getRepository(User);

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
    if (typeof isActive === 'boolean') user.isActive = isActive;
    
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
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router; 