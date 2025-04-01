import { EventEmitter } from 'events';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface User {
    id: string;
    username: string;
    password: string;
    role: 'admin' | 'operator' | 'viewer';
    permissions: string[];
    lastLogin?: Date;
    isActive: boolean;
}

interface SecurityConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    passwordSaltRounds: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
}

interface SecurityEvent {
    type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'system_alert';
    timestamp: Date;
    userId?: string;
    details: Record<string, unknown>;
}

export class SecurityManager extends EventEmitter {
    private users: Map<string, User>;
    private loginAttempts: Map<string, { count: number; lastAttempt: Date }>;
    private activeSessions: Map<string, { userId: string; expiresAt: Date }>;
    private securityEvents: SecurityEvent[];
    private config: SecurityConfig;

    constructor(config: SecurityConfig) {
        super();
        this.users = new Map();
        this.loginAttempts = new Map();
        this.activeSessions = new Map();
        this.securityEvents = [];
        this.config = config;
        this.startSessionCleanup();
    }

    public async registerUser(
        username: string,
        password: string,
        role: 'admin' | 'operator' | 'viewer',
        permissions: string[]
    ): Promise<User> {
        // Check if username exists
        if (Array.from(this.users.values()).some(u => u.username === username)) {
            throw new Error('Username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, this.config.passwordSaltRounds);

        // Create user
        const user: User = {
            id: this.generateUserId(),
            username,
            password: hashedPassword,
            role,
            permissions,
            isActive: true
        };

        // Store user with hashed password
        this.users.set(user.id, user);

        this.logSecurityEvent({
            type: 'system_alert',
            timestamp: new Date(),
            details: {
                message: `New user registered: ${username}`,
                role
            }
        });

        return user;
    }

    public async login(username: string, password: string): Promise<{ token: string; user: User }> {
        // Check login attempts
        const attempts = this.loginAttempts.get(username);
        if (attempts && attempts.count >= this.config.maxLoginAttempts) {
            const lockoutEnd = new Date(attempts.lastAttempt.getTime() + this.config.lockoutDuration);
            if (new Date() < lockoutEnd) {
                throw new Error('Account is locked. Please try again later.');
            }
            // Reset attempts if lockout period has passed
            this.loginAttempts.delete(username);
        }

        // Find user
        const user = Array.from(this.users.values()).find(u => u.username === username);
        if (!user || !user.isActive) {
            this.recordFailedLogin(username);
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            this.recordFailedLogin(username);
            throw new Error('Invalid credentials');
        }

        // Generate token
        const token = await this.generateToken(user);

        // Update user
        user.lastLogin = new Date();
        this.users.set(user.id, user);

        // Create session
        this.createSession(token, user.id);

        // Reset login attempts
        this.loginAttempts.delete(username);

        this.logSecurityEvent({
            type: 'login',
            timestamp: new Date(),
            details: {
                username,
                role: user.role
            }
        });

        return { token, user };
    }

    public async logout(token: string): Promise<void> {
        this.activeSessions.delete(token);
        this.logSecurityEvent({
            type: 'logout',
            timestamp: new Date(),
            details: {
                token
            }
        });
    }

    public async validateToken(token: string): Promise<User> {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret) as { userId: string };
            const session = this.activeSessions.get(token);
            
            if (!session || session.userId !== decoded.userId || new Date() > session.expiresAt) {
                throw new Error('Invalid or expired token');
            }

            const user = this.users.get(decoded.userId);
            if (!user || !user.isActive) {
                throw new Error('User not found or inactive');
            }

            return user;
        } catch (error) {
            await this.handleError(error);
            throw error;
        }
    }

    public async checkPermission(
        userId: string,
        permission: string
    ): Promise<boolean> {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }

        const hasPermission = user.permissions.includes(permission);
        if (!hasPermission) {
            this.logSecurityEvent({
                type: 'permission_denied',
                timestamp: new Date(),
                details: {
                    userId,
                    permission
                }
            });
        }

        return hasPermission;
    }

    public async deactivateUser(userId: string): Promise<void> {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.isActive = false;
        this.users.set(userId, user);

        // End all active sessions
        for (const [token, session] of this.activeSessions.entries()) {
            if (session.userId === userId) {
                this.activeSessions.delete(token);
            }
        }

        this.logSecurityEvent({
            type: 'system_alert',
            timestamp: new Date(),
            details: {
                message: `User deactivated: ${user.username}`,
                userId
            }
        });
    }

    public getSecurityEvents(
        startDate?: Date,
        endDate?: Date,
        type?: string
    ): SecurityEvent[] {
        return this.securityEvents.filter(event => {
            if (startDate && event.timestamp < startDate) return false;
            if (endDate && event.timestamp > endDate) return false;
            if (type && event.type !== type) return false;
            return true;
        });
    }

    private generateUserId(): string {
        return `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateToken(user: User): string {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions
        };
        
        return jwt.sign(payload, this.config.jwtSecret, {
            expiresIn: this.config.jwtExpiresIn
        } as jwt.SignOptions);
    }

    private createSession(token: string, userId: string): void {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + this.config.sessionTimeout);
        this.activeSessions.set(token, { userId, expiresAt });
    }

    private recordFailedLogin(username: string): void {
        const attempts = this.loginAttempts.get(username) || { count: 0, lastAttempt: new Date() };
        attempts.count++;
        attempts.lastAttempt = new Date();
        this.loginAttempts.set(username, attempts);

        this.logSecurityEvent({
            type: 'failed_login',
            timestamp: new Date(),
            details: {
                username,
                attemptCount: attempts.count
            }
        });
    }

    private logSecurityEvent(event: SecurityEvent): void {
        this.securityEvents.push(event);
        this.emit('security_event', event);
    }

    private startSessionCleanup(): void {
        // Clean up expired sessions every minute
        setInterval(() => {
            const now = new Date();
            for (const [token, session] of this.activeSessions.entries()) {
                if (now > session.expiresAt) {
                    this.activeSessions.delete(token);
                    this.logSecurityEvent({
                        type: 'system_alert',
                        timestamp: now,
                        details: {
                            message: 'Session expired',
                            userId: session.userId
                        }
                    });
                }
            }
        }, 60000);
    }

    private async handleError(error: unknown): Promise<void> {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.logSecurityEvent({
            type: 'system_alert',
            timestamp: new Date(),
            details: { error: errorMessage }
        });
    }
} 